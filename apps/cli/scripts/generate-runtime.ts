import { listRootCommands } from "../src/cli/command-registry";

const commands = listRootCommands();
console.log(`CLI command registry ready (${commands.length} root commands)`);
