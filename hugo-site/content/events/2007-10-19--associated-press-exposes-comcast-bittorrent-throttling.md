---
id: 2007-10-19--associated-press-exposes-comcast-bittorrent-throttling
date: '2007-10-19'
title: Associated Press Investigation Exposes Comcast's Secret BitTorrent Throttling and Blocking
importance: 8
actors:
- Comcast Corporation
- Associated Press
- Electronic Frontier Foundation
- TorrentFreak
tags:
- net-neutrality
- regulatory-capture
- telecommunications
- comcast
- corporate-deception
status: confirmed
sources:
- title: 'Associated Press Confirms That Comcast Blocks Some BitTorrent Traffic'
  url: https://www.techdirt.com/2007/10/19/associated-press-confirms-that-comcast-blocks-some-bittorrent-traffic-despite-comcast-denials/
  outlet: Techdirt
  date: '2007-10-19'
  tier: 2
- title: 'EFF tests agree with AP: Comcast is forging packets to interfere with user traffic'
  url: https://www.eff.org/deeplinks/2007/10/eff-tests-agree-ap-comcast-forging-packets-to-interfere
  outlet: Electronic Frontier Foundation
  date: '2007-10-19'
  tier: 1
- title: 'Comcast Blocks Some Internet Traffic'
  url: http://www.washingtonpost.com/wp-dyn/content/article/2007/10/19/AR2007101900842.html
  outlet: Washington Post
  date: '2007-10-19'
  tier: 1
---

The Associated Press publishes a comprehensive investigation revealing that Comcast, the nation's largest cable company and internet service provider, is secretly interfering with peer-to-peer file sharing applications including BitTorrent by forging network packets to block uploads. The AP investigation, which attempted to transfer public domain files including the Bible through BitTorrent, confirmed earlier allegations from TorrentFreak (August 2007) that Comcast had vehemently denied despite widespread user reports.

The investigation exposed that Comcast was using TCP RST (reset) packet forgery—a technique also employed by Chinese internet censorship systems—to make it appear that remote computers were requesting connection terminations when they were not. When confronted with the AP's evidence, Comcast initially continued to deny the allegations, stating "Comcast does not block access to any applications, including BitTorrent," despite clear technical evidence to the contrary. The Electronic Frontier Foundation independently verified the AP's findings through their own technical testing.

This marked "the most drastic example yet of data discrimination by a U.S. Internet service provider" and became a watershed moment in the net neutrality debate. The revelation demonstrated how ISPs could secretly manipulate internet traffic without transparency or accountability, undermining the principle that all internet traffic should be treated equally. The scandal would lead directly to FCC enforcement action and helped catalyze the broader movement for net neutrality protections to prevent ISPs from blocking, throttling, or discriminating against lawful internet traffic.
