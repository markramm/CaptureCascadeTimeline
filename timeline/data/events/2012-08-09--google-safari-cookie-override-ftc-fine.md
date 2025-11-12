---
date: '2012-08-09'
title: Google Fined Record $22.5M for Deliberately Overriding Safari Privacy Settings
description: Google agreed to pay a record $22.5 million civil penalty to settle FTC charges that it deliberately circumvented Apple Safari browser privacy settings to place tracking cookies on users who had explicitly blocked them. For several months in 2011-2012, Google exploited a technical loophole to bypass Safari's default cookie-blocking settings, placing DoubleClick advertising tracking cookies to monitor users across websites. Google claimed the privacy violation was accidental, but internal evidence showed the company knowingly designed the workaround. The settlement was the largest civil penalty ever imposed on a single company for violating FTC rules, and it violated a prior 2011 consent decree from the Google Buzz privacy scandal—demonstrating Google's pattern of deliberate privacy violations for profit.
actors:
- Google
- Federal Trade Commission
- Apple
- Jon Leibowitz (FTC Chairman)
- Stanford Web Security Research
importance: 9
tags:
- google
- privacy-violation
- ftc
- tracking
- safari
- cookies
- surveillance-capitalism
- consent-decree-violation
sources:
- title: Google Will Pay $22.5 Million to Settle FTC Charges it Misrepresented Privacy Assurances to Users of Apple's Safari Internet Browser
  url: https://www.ftc.gov/news-events/news/press-releases/2012/08/google-will-pay-225-million-settle-ftc-charges-it-misrepresented-privacy-assurances-users-apples
  outlet: Federal Trade Commission
  date: '2012-08-09'
- title: Milking cookies - the FTC's $22.5 million settlement with Google
  url: https://www.ftc.gov/business-guidance/blog/2012/08/milking-cookies-ftcs-225-million-settlement-google
  outlet: Federal Trade Commission
  date: '2012-08-17'
- title: Google to pay $22.5 million fine for Safari privacy evasion
  url: https://money.cnn.com/2012/07/11/technology/google-ftc-settlement/index.htm
  outlet: CNN Money
  date: '2012-07-11'
- title: Google Settles With FTC, Agrees To Pay $22.5M Penalty For Bypassing Safari Privacy Settings
  url: https://techcrunch.com/2012/08/09/google-settles-with-ftc-agrees-to-pay-22-5m-penalty-for-bypassing-safari-privacy-settings/
  outlet: TechCrunch
  date: '2012-08-09'
status: confirmed
id: 2012-08-09--google-safari-cookie-override-ftc-fine
capture_lanes:
- Surveillance Capitalism
- Regulatory Capture
- Corporate Crime
capture_type: privacy_violation
patterns:
- deliberate-privacy-violation
- regulatory-evasion
- consent-decree-violation
connections:
- Google Buzz privacy violations
- DoubleClick advertising tracking
- Pattern of privacy violations for profit
notes: Demonstrated Google's willingness to deliberately violate user privacy and consent decrees for advertising revenue. The "accidental" claim was contradicted by the technical sophistication required to exploit the Safari loophole.
---

On August 9, 2012, the Federal Trade Commission announced that Google would pay a record $22.5 million civil penalty—the largest ever levied against a single company in FTC history—to settle charges of deliberately circumventing Apple Safari browser privacy settings to track users without their consent.

## The Privacy Violation

For several months in 2011 and 2012, Google placed advertising tracking cookies on the computers of Safari users who visited sites within Google's DoubleClick advertising network. This occurred despite Safari's default settings explicitly blocking third-party cookies to protect user privacy.

Google exploited a technical loophole in Safari's privacy protections: it used a hidden form submission to place a temporary cookie from the DoubleClick domain. This initial temporary cookie then opened the door to all cookies from the DoubleClick domain, including Google's persistent advertising tracking cookie—exactly what Safari's privacy settings were designed to prevent.

## Violation of Prior Consent Decree

The FTC charged that Google's misrepresentations violated a consent decree it had reached with the agency in October 2011 following the Google Buzz privacy scandal. That earlier settlement explicitly barred Google from misrepresenting "the extent to which consumers can exercise control over the collection of their information."

The Safari cookie override occurred while Google was already under FTC oversight for privacy violations—demonstrating the company's willingness to continue illegal practices even while subject to regulatory sanctions.

## Google's "Accidental" Claim

Google did not admit wrongdoing as part of the settlement, characterizing the privacy violation as unintentional. However, the technical sophistication required to exploit Safari's form submission exception contradicted claims of accident. Stanford Web Security Research documented that Google had deliberately engineered the workaround.

The exploit required:
1. Understanding Safari's specific privacy implementation
2. Identifying the form submission exception
3. Designing code to exploit that exception
4. Deploying the code across DoubleClick's advertising network
5. Monitoring its effectiveness over many months

## Financial Calculus

The $22.5 million penalty was unprecedented but represented a tiny fraction of Google's advertising revenue. In 2012, Google earned approximately $43.7 billion in advertising revenue, making the fine equivalent to less than 5 hours of ad income.

This established a pattern: deliberate privacy violations could be treated as a cost of doing business, with penalties small enough to make violations profitable.

## Systemic Privacy Violations

The Safari cookie override was not isolated. It followed:
- **2010**: Google Buzz automatically enrolled Gmail users in social network without consent
- **2011**: FTC consent decree for Buzz privacy violations
- **2012**: Safari cookie override (while under consent decree)
- **2013-2014**: Safari cookie overrides continued on other browsers

The pattern demonstrated that privacy violations were not mistakes but systematic practices designed to maximize surveillance and advertising revenue regardless of user consent or legal restrictions.

## Significance for Surveillance Capitalism

The Safari cookie override crystallized Google's business model: comprehensive user surveillance for targeted advertising, with privacy settings treated as obstacles to circumvent rather than user preferences to respect. Even explicit technical privacy protections and federal consent decrees would not prevent Google from tracking users for profit.
