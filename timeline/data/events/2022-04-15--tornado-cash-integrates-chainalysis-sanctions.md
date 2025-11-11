---
id: 2022-04-15--tornado-cash-integrates-chainalysis-sanctions
date: 2022-04-15
title: Tornado Cash Integrates Chainalysis Tool to Block OFAC-Sanctioned Addresses
importance: 7
tags:
  - surveillance
  - cryptocurrency
  - sanctions
  - privacy
  - OFAC
actors:
  - Tornado Cash
  - Chainalysis
  - OFAC
sources:
  - url: https://www.coindesk.com/tech/2022/04/15/tornado-cash-adds-chainalysis-tool-for-blocking-ofac-sanctioned-wallets-from-dapp
    title: Tornado Cash Adds Chainalysis Tool for Blocking OFAC-Sanctioned Wallets
    publisher: CoinDesk
    date: 2022-04-15
    tier: 1
  - url: https://www.cryptotimes.io/2022/04/16/tornado-cash-uses-chainalysis-to-block-ofac-sanctioned-addresses/
    title: Tornado Cash Uses Chainalysis to Block OFAC Sanctioned Addresses
    publisher: The Crypto Times
    date: 2022-04-16
    tier: 2
---

Tornado Cash, the decentralized cryptocurrency mixer designed to enhance transaction privacy, integrates Chainalysis's oracle contract to block OFAC-sanctioned addresses from accessing the dapp. This controversial move represents a significant compromise of the privacy tool's core function, as it implements government sanctions screening through blockchain surveillance technology.

## Chainalysis Oracle for Sanctions Compliance

The integration uses Chainalysis's free smart contract oracle that scans for crypto wallets sanctioned by various governments. Chainalysis launched this sanctions-screening tool in March 2022 against the backdrop of Russia's invasion of Ukraine and increasing government focus on cryptocurrency sanctions compliance. The oracle provides real-time screening of blockchain addresses against government sanctions lists, enabling smart contracts to automatically block sanctioned parties.

## Privacy vs. Compliance Tension

Tornado Cash's decision to integrate sanctions screening highlights a fundamental tension in the cryptocurrency ecosystem. The mixer was designed specifically to enhance transaction privacy by breaking the link between sending and receiving addresses. However, regulatory pressure forces the project to compromise this core functionality by implementing government-mandated surveillance. The integration demonstrates that even decentralized privacy tools face significant pressure to incorporate compliance mechanisms.

## Technical Implementation

The Chainalysis oracle operates as a smart contract that Tornado Cash's front-end interface queries before allowing transactions. When a user attempts to use the mixer, the system checks their wallet address against Chainalysis's sanctions database. If a match is found, the front-end blocks access to the mixing service. However, because Tornado Cash's smart contracts are decentralized and immutable, technically sophisticated users can still access the mixing functionality directly through the blockchain, bypassing the sanctions-screening front-end.

## Industry Implications

Tornado Cash's adoption of the Chainalysis oracle sets a precedent for other DeFi protocols and privacy tools. The move signals that maintaining compliance with government sanctions has become essential for cryptocurrency projects seeking legitimacy, even those explicitly designed for privacy. This represents a broader trend of traditional regulatory frameworks being extended to decentralized systems through surveillance infrastructure.

## Foreshadowing Future Sanctions

Ironically, this compliance effort proves insufficient to protect Tornado Cash from government action. Just four months later, in August 2022, the U.S. Treasury's Office of Foreign Assets Control will sanction Tornado Cash entirely, adding it to the Specially Designated Nationals list. The sanctions will come after OFAC determines that Tornado Cash has been used to launder over $455 million in cryptocurrency stolen by North Korea's Lazarus Group, among other illicit actors.

## Significance

The integration of Chainalysis sanctions screening into Tornado Cash demonstrates how blockchain surveillance infrastructure becomes embedded in the cryptocurrency ecosystem, even in tools explicitly designed for privacy. This development shows that government regulatory pressure, enforced through surveillance technology, can compel decentralized projects to implement compliance mechanisms that fundamentally compromise their core privacy functions. The event illustrates the growing power of blockchain analytics companies like Chainalysis to shape cryptocurrency protocol design and operation, effectively privatizing enforcement of government sanctions through commercial surveillance tools.
