---
title: "Use Case Guides"
description: "Scenario-based guidance for OTP, order notifications, and marketing messaging."
---

These guides start from business goals rather than package boundaries. Use them when you already know the customer workflow you need to support.

## Which guide should you read first?

### [OTP Verification](/en/guides/use-cases/otp-verification/)

Use this when:

- login or step-up authentication is your first target
- delivery speed matters more than rich formatting
- you need SMS-first guidance

### [Order Notifications](/en/guides/use-cases/order-notification/)

Use this when:

- you are sending transactional commerce updates
- AlimTalk is your preferred primary channel
- you need template-based variables and optional SMS fallback

### [Marketing Messages](/en/guides/use-cases/marketing-message/)

Use this when:

- the campaign is consent-based and promotional
- you are choosing between FriendTalk and SMS
- segmentation and send timing matter as much as delivery

## In production

### [Case Study: K-OTP](/en/guides/use-cases/k-otp/)

Read this when you want to see the OTP pattern as it runs in a production service:

- AlimTalk first, with an SMS failover that never duplicates a message
- telling refused sends apart from unknown outcomes before retrying
- encrypted delivery tracking, status polling, and WebOTP-friendly SMS text

## Why this section exists

Different messaging problems need different channel choices:

- OTP favors reach and speed
- order notifications favor transactional clarity and open rate
- marketing favors consent, segmentation, and content format

Choose the guide that matches the business outcome first, then refine package and provider decisions later.
