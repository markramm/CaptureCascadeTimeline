---
date: '2017-01-01'
title: 'Google Manipulates Ad Auctions Through "Project Bernanke" to Favor Own Exchange'
description: 'Internal documents revealed in the Texas Attorney General''s antitrust lawsuit exposed "Project Bernanke"—Google''s secret program that manipulated second-price ad auctions to advantage its own ad-buying platform. Launched in 2013, the program used historical bidding data and insider information to give Google Ads bidders unfair advantages over advertisers using competing platforms. Google dropped second-highest bids from publishers'' auctions, pooled the money, and used those funds to boost only Google Ads bidders—helping them win auctions they would have otherwise lost. Internal analysis showed Bernanke dropped publisher revenues by up to 40%, with one Google employee noting: "Bernanke is powerful." The systematic auction manipulation allowed Google to exploit both publishers (who received lower revenues) and advertisers (who paid inflated prices), exemplifying how vertical integration enabled fraud-level manipulation.'
actors:
- Google
- Texas Attorney General Ken Paxton
- Publishers
- Advertisers
- Google Ads platform
importance: 10
tags:
- google
- ad-tech
- auction-manipulation
- project-bernanke
- fraud
- monopoly-abuse
- texas-lawsuit
sources:
- title: Third Amended Complaint - Texas v. Google
  url: https://texasattorneygeneral.gov/sites/default/files/images/child-support/20220114_195_0_States%20Third%20Amended%20Complaint.pdf
  outlet: Texas Attorney General
  date: '2022-01-14'
- title: More Details Revealed On Project Bernanke And Jedi Blue In Newly Unsealed Google Suit
  url: https://www.adexchanger.com/online-advertising/more-details-revealed-on-project-bernanke-and-jedi-blue-in-newly-unsealed-google-suit/
  outlet: AdExchanger
  date: '2021-04-16'
- title: Google gamed its ad auction system to favor its own ads, generated $213 million
  url: https://appleinsider.com/articles/21/04/11/google-bernanke-revealed-in-ad-business-antitrust-lawsuit-error
  outlet: AppleInsider
  date: '2021-04-11'
- title: How Google Manipulated Digital Ad Prices and Hurt Publishers
  url: https://www.techpolicy.press/how-google-manipulated-digital-ad-prices-and-hurt-publishers-per-doj/
  outlet: TechPolicy.Press
  date: '2023-09-12'
status: confirmed
id: 2017-01-01--google-project-bernanke-auction-manipulation
capture_lanes:
- Corporate Crime
- Monopolization
- Market Manipulation
- Fraud
capture_type: systematic_fraud
patterns:
- auction-manipulation
- insider-trading-analog
- vertical-integration-abuse
- systematic-fraud
connections:
- Google ad tech monopoly
- Publisher exploitation
- Texas antitrust lawsuit
notes: Named after Fed Chairman Ben Bernanke for its manipulation of "monetary policy" in ad auctions. Represents one of clearest examples of how vertical integration enabled Google to commit what amounted to systematic fraud against both publishers and advertisers.
---

In 2017, Google's secret "Project Bernanke" was in full operation—a systematic auction manipulation scheme that used insider information and algorithmic deception to advantage Google's own ad-buying platform while harming both publishers and competing advertisers. The program's existence and mechanics were later revealed through internal Google documents disclosed in the Texas Attorney General's antitrust lawsuit filed in December 2020.

## What Was Project Bernanke?

Project Bernanke was a secret program, named after Federal Reserve Chairman Ben Bernanke for its manipulation of ad auction "monetary policy," that Google launched in 2013 to increase the win rates of advertisers using Google's ad-buying platform (Google Ads, formerly AdWords) when competing on Google's ad exchange (AdX, formerly DoubleClick Ad Exchange).

The program's stated goal was "to increase the win rates of our advertiser clients on AdX" by using historical bidding data and insider information that only Google possessed—creating what amounted to insider trading in advertising auctions.

## How Second-Price Auctions Work

To understand Bernanke's manipulation, it's essential to understand second-price auctions:

In a traditional second-price auction:
1. Bidders submit sealed bids
2. The highest bidder wins
3. **The winner pays the second-highest bid** (not their own bid)

This mechanism is supposed to be "incentive compatible"—bidders have no reason to bid anything other than their true value because they'll only pay the second-highest price.

**Example**:
- Advertiser A bids $10
- Advertiser B bids $8
- Advertiser C bids $6
- A wins and pays $8 (B's bid)
- Publisher receives $8

## Bernanke's Manipulation Mechanism

Project Bernanke corrupted this auction design through systematic manipulation:

### Step 1: Identify Second-Highest Bids
Google's control of the ad exchange (AdX) gave it visibility into all bids—including the second-highest bid that determines the clearing price.

### Step 2: Drop the Second-Highest Bid
When the winning bid came from Google Ads (Google's own ad-buying platform), Bernanke would **drop the second-highest bid from the auction** if it came from a competing ad-buying platform. This created "savings" because the Google Ads bidder would pay less than it should.

**Manipulated example**:
- Google Ads bidder A bids $10
- Competing platform bidder B bids $8 ← **Bernanke drops this**
- Competing platform bidder C bids $6
- A wins and pays only $6 instead of $8
- Google pockets $2, publisher loses $2

### Step 3: Pool the "Savings"
The difference between what the winning bidder should have paid (second-highest bid) and what they actually paid (manipulated price) was pooled into a fund.

### Step 4: Redistribute to Google Ads Bidders
This pooled money was then redistributed **exclusively to advertisers using Google Ads**—boosting their bids in future auctions and helping them win against competitors.

This created a vicious cycle:
- Google Ads bidders got artificial boosts from the pooled fund
- They won more auctions (sometimes unfairly)
- Non-Google bidders couldn't compete
- Google Ads platform dominance increased

## Evidence from Internal Documents

The Texas Attorney General's lawsuit revealed damning internal Google documents about Bernanke:

### Google Knew It Harmed Publishers

**Internal analysis**: "Bernanke drops any given publisher's revenue by upwards of 40 percent."

**Employee assessment**: "Bernanke is powerful."

Google's own analysis showed the program significantly reduced publisher revenues—yet the company continued operating it for years because it advantaged Google's own platform.

### Strategic Intent

Internal documents showed Bernanke was explicitly designed to give Google Ads unfair advantages:

"Project Bernanke uses data from [publishers' auctions] to advantage Google's own exchange in a given auction."

The program gave Google Ads bidders "a competitive edge against rivals" by providing them with information and monetary boosts that competing platforms couldn't access.

### Scale of Manipulation

While complete financial data remains sealed, partially-redacted court documents indicated:
- Bernanke generated substantial revenue for Google (some reports suggested $213 million, though exact figures are disputed)
- The program operated for at least 4-5 years
- It affected thousands of publishers and millions of advertising transactions daily

## How Vertical Integration Enabled Fraud

Project Bernanke exemplifies how Google's vertical integration across the ad tech stack enabled systematic fraud:

**Without vertical integration** (competitive market):
- Publishers would use independent ad servers
- Ad exchanges would be neutral marketplaces
- Advertiser platforms couldn't see competitor bids
- No opportunity for auction manipulation

**With Google's vertical integration**:
- Google controlled publisher ad servers (seeing all bids)
- Google controlled ad exchange (manipulating auction mechanics)
- Google controlled advertiser platform (benefiting from manipulation)
- Google had complete information and control to systematically cheat

The key insight: **Vertical integration gave Google the information (seeing all bids) and control (manipulating auction mechanics) necessary to engage in what would be illegal insider trading in any other market.**

## Dual Exploitation: Publishers and Advertisers

Bernanke harmed both sides of the advertising marketplace:

### Publisher Harm
Publishers received lower revenues because:
- Second-highest bids were artificially dropped
- Clearing prices were systematically reduced
- Google pocketed the difference as monopoly rents
- Publishers had no visibility into manipulation

The 40% revenue reduction documented in Google's internal analysis represented billions of dollars transferred from publishers to Google over the program's lifetime.

### Advertiser Harm
Competing advertisers (using non-Google platforms) were harmed because:
- Their second-price bids were used to set artificially low prices for Google Ads bidders
- Google Ads bidders received artificial boosts from pooled funds
- They lost auctions they should have won fairly
- They overpaid when they did win (because Google manipulated auctions when they won too)

## The "Last Look" Advantage

Bernanke operated in conjunction with Google's "last look" advantage—the ability to see all competing bids before making final decisions. In competitive ad exchanges, all bidders submit sealed bids simultaneously. But Google's vertical integration meant:

1. Competing platforms submitted bids first
2. Google saw those bids through its exchange control
3. Google could adjust its own bids with full information
4. Google could manipulate auction mechanics (Bernanke) after seeing all bids

This is analogous to:
- Playing poker where one player sees everyone else's cards
- Trading stocks where one firm sees all buy/sell orders before executing their own
- Sports betting where one bookmaker knows all bets before setting final odds

In any other market, such informational advantages would constitute fraud.

## Legal Implications

The Texas Attorney General's lawsuit characterized Bernanke as evidence of:

**Monopoly abuse**: Using dominance in ad exchanges to advantage Google's own ad-buying platform

**Fraud**: Systematically deceiving publishers about auction mechanics and prices

**Breach of fiduciary duty**: Google claimed to work for publishers through its ad server but actively harmed them for its own benefit

**Anticompetitive exclusion**: Making it impossible for competing ad platforms to compete fairly, foreclosing competition

## Google's Defense

Google defended Project Bernanke by arguing:

1. **Not secret**: The program's existence was mentioned in some documentation (though its mechanics weren't disclosed)

2. **Industry standard**: Other platforms use historical data to optimize bids (though none had Google's complete informational advantage)

3. **Benefited advertisers**: Google Ads users achieved better ROI (by systematically cheating publishers and competitors)

4. **Mischaracterized**: The Texas lawsuit "misrepresents" how Bernanke worked

However, Google never disputed:
- That Bernanke dropped publisher revenues by up to 40%
- That it used insider information unavailable to competitors
- That it systematically advantaged Google Ads over competing platforms
- That publishers had no visibility into the manipulation

## Comparison to Financial Market Manipulation

Project Bernanke had close analogies to securities fraud:

**Front running**: Using knowledge of pending orders to trade ahead of customers
- **Bernanke equivalent**: Using knowledge of all bids to manipulate prices for Google's benefit

**Market manipulation**: Artificially influencing prices for personal gain
- **Bernanke equivalent**: Dropping second-highest bids to create artificial price reductions

**Insider trading**: Using non-public information to gain trading advantages
- **Bernanke equivalent**: Using publisher auction data to advantage Google's own platform

If conducted in securities markets, Bernanke's practices would clearly violate:
- Securities Exchange Act Section 10(b)
- SEC Rule 10b-5 (fraud and manipulation)
- FINRA rules against front-running
- Wire fraud statutes

The fact that advertising auctions weren't explicitly regulated didn't make the conduct any less fraudulent—it simply meant Google found an unregulated market to exploit.

## Connection to Jedi Blue and Broader Pattern

Bernanke wasn't isolated—it was part of Google's systematic manipulation of advertising markets:

**2013**: Launched Project Bernanke to manipulate auctions
**2018**: Struck "Jedi Blue" agreement with Facebook to prevent header bidding competition
**2019**: Manipulated unified pricing rules to disadvantage competing exchanges
**2020**: Texas and other states sued over systematic ad tech manipulation

Each scheme demonstrated how vertical integration enabled Google to systematically cheat both publishers and advertisers while maintaining a facade of neutral marketplace operation.

## Impact on Digital Media Economics

Project Bernanke contributed to journalism's economic collapse:

- News publishers already struggling with digital transition
- Google's monopoly take-rate of 30-50% extracted value from advertising
- Bernanke reduced publisher revenues by additional 40%
- Combined effect made ad-supported journalism economically unviable
- Thousands of newspapers closed or dramatically cut staff

The systematic extraction of tens of billions from publishers through monopoly abuse and fraud directly funded Google's growth while impoverishing the journalism and digital media industries.

## Significance

Project Bernanke represents perhaps the clearest example of how vertical integration of platform infrastructure can enable systematic fraud. By controlling publisher ad servers, ad exchanges, and advertiser tools, Google had:

1. **Complete information**: Seeing all bids from all participants
2. **Monopoly control**: Ability to manipulate auction mechanics
3. **Conflicts of interest**: Incentive to advantage its own platform over users' interests
4. **Opacity**: Publishers and advertisers couldn't see the manipulation

The program demonstrated that dominant platforms can engage in fraud-level manipulation while maintaining plausible deniability through technical complexity and information asymmetries. Only when internal documents emerged through litigation did the systematic nature of the exploitation become clear.

The DOJ's 2023 antitrust suit seeking to break up Google's ad tech business cited Bernanke as evidence that behavioral remedies would be insufficient—structural separation was necessary to eliminate the conflicts of interest and informational advantages that enabled such manipulation.
