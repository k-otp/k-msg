#!/usr/bin/env node

/* eslint-disable no-console */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { get as httpsGet } from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

function pkgRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readVersion() {
  const pkg = readJsonFile(path.join(pkgRoot(), "package.json"));
  if (typeof pkg.version !== "string" || pkg.version.trim().length === 0) {
    throw new Error("Invalid package.json version");
  }
  return pkg.version;
}

function resolveTarget(platform, arch) {
  if (platform === "darwin" && arch === "arm64") return "darwin-arm64";
  if (platform === "darwin" && arch === "x64") return "darwin-x64";
  if (platform === "linux" && arch === "arm64") return "linux-arm64";
  if (platform === "linux" && arch === "x64") return "linux-x64";
  if (platform === "win32" && arch === "x64") return "windows-x64";
  throw new Error(`Unsupported platform/arch: ${platform}/${arch}`);
}

function cacheBaseDir() {
  const override = process.env.K_MSG_CLI_CACHE_DIR;
  if (typeof override === "string" && override.trim().length > 0) {
    return override;
  }

  if (process.platform === "win32") {
    return (
      process.env.LOCALAPPDATA ||
      process.env.APPDATA ||
      path.join(os.homedir(), "AppData", "Local")
    );
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Caches");
  }

  return process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
}

function downloadText(url) {
  return new Promise((resolve, reject) => {
    const req = httpsGet(
      url,
      { headers: { "User-Agent": "@k-msg/cli" } },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          const redirected = new URL(res.headers.location, url).toString();
          res.resume();
          downloadText(redirected).then(resolve, reject);
          return;
        }
        if (status !== 200) {
          res.resume();
          reject(new Error(`GET ${url} failed (status=${status})`));
          return;
        }
        res.setEncoding("utf8");
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      },
    );
    req.on("error", reject);
  });
}

function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const req = httpsGet(
      url,
      { headers: { "User-Agent": "@k-msg/cli" } },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          const redirected = new URL(res.headers.location, url).toString();
          res.resume();
          downloadToFile(redirected, destPath).then(resolve, reject);
          return;
        }
        if (status !== 200) {
          res.resume();
          reject(new Error(`GET ${url} failed (status=${status})`));
          return;
        }

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
        file.on("error", reject);
      },
    );
    req.on("error", reject);
  });
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function parseChecksums(text) {
  const out = new Map();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const m = /^([a-f0-9]{64})\s+\*?(.+)$/.exec(trimmed);
    if (!m) continue;
    const [, sum, file] = m;
    out.set(file, sum);
  }
  return out;
}

function safeRealpath(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return null;
  }
}

function isWritableFile(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function parseVersionFromOutput(output) {
  const m = /\bk-msg v([0-9]+\.[0-9]+\.[0-9]+)\b/.exec(output);
  return m ? m[1] : null;
}

function readCommandVersion(commandPath) {
  const result = spawnSync(commandPath, ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 3000,
  });
  if (result.error || result.status !== 0) return null;
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  return parseVersionFromOutput(output);
}

function resolveActiveCommand(commandName) {
  const pathValue = process.env.PATH || "";
  const dirs = pathValue.split(path.delimiter).filter(Boolean);
  const suffixes =
    process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];

  for (const dir of dirs) {
    for (const suffix of suffixes) {
      const candidate = path.join(dir, `${commandName}${suffix}`);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function listActiveCommandCandidates() {
  const seen = new Set();
  const out = [];
  for (const name of ["k-msg", "kmsg"]) {
    const resolved = resolveActiveCommand(name);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    out.push(resolved);
  }
  return out;
}

function isLikelyNativeExecutable(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(4);
    const read = fs.readSync(fd, buffer, 0, 4, 0);
    if (read < 2) return false;

    // ELF
    if (
      read >= 4 &&
      buffer[0] === 0x7f &&
      buffer[1] === 0x45 &&
      buffer[2] === 0x4c &&
      buffer[3] === 0x46
    ) {
      return true;
    }

    // Mach-O (32/64, little/big endian)
    if (read >= 4) {
      const magic = buffer.readUInt32BE(0);
      if (
        magic === 0xfeedface ||
        magic === 0xfeedfacf ||
        magic === 0xcefaedfe ||
        magic === 0xcffaedfe
      ) {
        return true;
      }
    }

    // PE/COFF (Windows)
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return true;
    }
  } catch {
    return false;
  } finally {
    if (typeof fd === "number") {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore
      }
    }
  }

  return false;
}

function replaceBinary({ sourcePath, targetPath }) {
  const tmpPath = `${targetPath}.kmsg-sync-${process.pid}.tmp`;
  fs.copyFileSync(sourcePath, tmpPath);
  if (process.platform !== "win32") {
    fs.chmodSync(tmpPath, 0o755);
  }
  fs.renameSync(tmpPath, targetPath);
}

function syncLegacyCommandPaths({ binaryPath, version }) {
  const syncOptOut = process.env.K_MSG_CLI_SYNC_PATHS;
  if (
    typeof syncOptOut === "string" &&
    ["0", "false", "off"].includes(syncOptOut.trim().toLowerCase())
  ) {
    return;
  }

  const selfScript = safeRealpath(process.argv[1] || "");
  const binaryReal = safeRealpath(binaryPath);
  const updated = [];

  for (const candidate of listActiveCommandCandidates()) {
    let stat;
    try {
      stat = fs.lstatSync(candidate);
    } catch {
      continue;
    }

    if (!stat.isFile() || stat.isSymbolicLink()) continue;
    if (!isWritableFile(candidate)) continue;
    if (!isLikelyNativeExecutable(candidate)) continue;

    const candidateReal = safeRealpath(candidate);
    if (candidateReal && selfScript && candidateReal === selfScript) continue;
    if (candidateReal && binaryReal && candidateReal === binaryReal) continue;

    const currentVersion = readCommandVersion(candidate);
    if (!currentVersion || currentVersion === version) continue;

    try {
      replaceBinary({ sourcePath: binaryPath, targetPath: candidate });
      updated.push({ path: candidate, from: currentVersion });
    } catch {
      // Best-effort sync: ignore per-path failures.
    }
  }

  for (const item of updated) {
    console.error(
      `[k-msg] Synced existing install: ${item.path} (${item.from} -> ${version})`,
    );
  }
}

function tarReadString(header, start, len) {
  const slice = header.subarray(start, start + len);
  const zero = slice.indexOf(0);
  const end = zero === -1 ? slice.length : zero;
  return slice.subarray(0, end).toString("utf8");
}

function tarIsEmptyBlock(block) {
  for (let i = 0; i < block.length; i++) {
    if (block[i] !== 0) return false;
  }
  return true;
}

function extractFileFromTarGz({ archivePath, filePathInTar, outPath }) {
  const tar = gunzipSync(fs.readFileSync(archivePath));
  let off = 0;

  while (off + 512 <= tar.length) {
    const header = tar.subarray(off, off + 512);
    if (tarIsEmptyBlock(header)) break;

    const name = tarReadString(header, 0, 100);
    const prefix = tarReadString(header, 345, 155);
    const fullName = prefix ? `${prefix}/${name}` : name;

    const sizeOct = tarReadString(header, 124, 12).trim();
    const size = sizeOct.length ? Number.parseInt(sizeOct, 8) : 0;
    const typeflag = header[156];

    const dataStart = off + 512;
    const dataEnd = dataStart + size;

    const isFile = typeflag === 0 || typeflag === 48; // '\0' or '0'
    if (isFile && fullName === filePathInTar) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, tar.subarray(dataStart, dataEnd));
      return;
    }

    const blocks = Math.ceil(size / 512);
    off = dataStart + blocks * 512;
  }

  throw new Error(`Missing file in archive: ${filePathInTar}`);
}

async function ensureBinary() {
  const version = readVersion();
  const target = resolveTarget(process.platform, process.arch);
  const ext = process.platform === "win32" ? ".exe" : "";

  const cacheDir = path.join(cacheBaseDir(), "k-msg", "cli", version, target);
  const dest = path.join(cacheDir, `k-msg${ext}`);

  if (fs.existsSync(dest)) {
    return { binaryPath: dest, version, freshlyInstalled: false };
  }

  const local = process.env.K_MSG_CLI_LOCAL_BINARY;
  if (typeof local === "string" && local.trim().length > 0) {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.copyFileSync(local, dest);
    if (process.platform !== "win32") {
      fs.chmodSync(dest, 0o755);
    }
    return { binaryPath: dest, version, freshlyInstalled: true };
  }

  const baseUrl =
    process.env.K_MSG_CLI_BASE_URL ||
    `https://github.com/k-otp/k-msg/releases/download/cli-v${version}`;
  const assetName = `k-msg-cli-${version}-${target}.tar.gz`;
  const assetUrl = `${baseUrl}/${assetName}`;
  const checksumsUrl = `${baseUrl}/checksums.txt`;

  fs.mkdirSync(cacheDir, { recursive: true });

  const archiveTmp = `${dest}.tar.gz.download`;
  const binTmp = `${dest}.download`;

  console.error(`[k-msg] Installing native binary (${target})...`);

  try {
    const checksumsText = await downloadText(checksumsUrl);
    const checksums = parseChecksums(checksumsText);
    const expected = checksums.get(assetName);
    if (!expected) {
      throw new Error(`Missing checksum entry for ${assetName}`);
    }

    await downloadToFile(assetUrl, archiveTmp);
    const actual = await sha256File(archiveTmp);
    if (actual !== expected) {
      throw new Error(
        `Checksum mismatch for ${assetName}\nexpected=${expected}\nactual=${actual}`,
      );
    }

    extractFileFromTarGz({
      archivePath: archiveTmp,
      filePathInTar: `${target}/k-msg${ext}`,
      outPath: binTmp,
    });

    fs.renameSync(binTmp, dest);
    if (process.platform !== "win32") {
      fs.chmodSync(dest, 0o755);
    }
    fs.rmSync(archiveTmp, { force: true });
    return { binaryPath: dest, version, freshlyInstalled: true };
  } catch (err) {
    fs.rmSync(archiveTmp, { force: true });
    fs.rmSync(binTmp, { force: true });
    throw err;
  }
}

async function main() {
  const resolved = await ensureBinary();
  syncLegacyCommandPaths({
    binaryPath: resolved.binaryPath,
    version: resolved.version,
  });
  const bin = resolved.binaryPath;
  const result = spawnSync(bin, process.argv.slice(2), { stdio: "inherit" });
  if (result.error) {
    console.error(result.error);
    process.exitCode = 1;
    return;
  }
  if (typeof result.status === "number") {
    process.exitCode = result.status;
    return;
  }
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
