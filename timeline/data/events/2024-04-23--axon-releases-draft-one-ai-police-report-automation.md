---
id: 2024-04-23--axon-releases-draft-one-ai-police-report-automation
date: '2024-04-23'
title: Axon Releases Draft One AI System to Automate Police Report Writing from Body Camera Audio
importance: 9
tags:
- axon
- draft-one
- ai
- gpt-4
- police-reports
- automation
- body-cameras
- evidence-manipulation
- ai-policing
- algorithmic-bias
- automated-criminal-justice
- surveillance-infrastructure
- transparency
actors:
- Axon
- OpenAI
- Microsoft
- Electronic Frontier Foundation
sources:
- url: https://investor.axon.com/2024-04-23-Axon-reimagines-report-writing-with-Draft-One,-a-first-of-its-kind-AI-powered-force-multiplier-for-public-safety
  title: Axon reimagines report writing with Draft One, a first-of-its-kind AI-powered force multiplier for public safety
  date: '2024-04-23'
  tier: 2
  outlet: Axon Investor Relations
- url: https://www.cnn.com/2025/08/12/tech/ai-police-reports-axon
  title: How AI is being used by police departments to help draft reports
  date: '2025-08-12'
  tier: 1
  outlet: CNN
- url: https://www.axon.com/products/draft-one
  title: Draft One Product Overview
  date: '2024-04-23'
  tier: 2
  outlet: Axon
- url: https://www.eff.org/deeplinks/2025/07/axons-draft-one-designed-defy-transparency
  title: Axon's Draft One Is Designed to Defy Transparency
  date: '2025-07-16'
  tier: 1
  outlet: Electronic Frontier Foundation
- url: https://www.axon.com/blog/unlocking-next-generation-productivity-in-the-field-with-axon-ai
  title: Unlocking next-generation productivity in the field with Axon AI
  date: '2025-02-01'
  tier: 2
  outlet: Axon
status: confirmed
---

On April 23, 2024, Axon released Draft One, an AI-powered system that automatically generates police report narratives from body-worn camera audio using OpenAI's GPT-4 Turbo model built on Microsoft Azure infrastructure. The system transcribes audio from Axon Body 3 and 4 cameras uploaded over LTE and produces complete report drafts within five minutes of an incident ending, addressing the fact that officers spend up to 40% of their time (15 hours per week) on report writing. By February 2025, Draft One had generated over 100,000 incident reports, saving 2.2 million minutes of officer time, with some agencies reporting up to 82% reduction in report-writing time. Draft One rapidly became Axon's fastest-growing product, demonstrating strong demand for AI automation of police documentation despite significant concerns about accuracy, bias, and the potential for AI-generated reports to legitimize false police narratives. Combined with Axon's November 2025 acquisition of Carbyne (an AI-powered 911 call platform), Draft One creates a complete end-to-end AI pipeline from emergency call intake through police encounter recording to automated report generation.

## Technical Implementation and Capabilities

Draft One leverages body camera audio that is automatically uploaded to the cloud and transcribed, using GPT-4 Turbo to generate complete incident narratives from the transcribed conversations, observations, and interactions. The system integrates seamlessly with Axon Body cameras, Evidence.com cloud storage, and Axon Records management systems, creating an end-to-end automated pipeline from incident capture to report filing. Officers can edit drafts before submission, and the system includes placeholders that require active completion to prevent fully automated report generation. Axon configured the default settings to limit report drafts to minor incidents and misdemeanors, specifically excluding incidents involving arrests and felonies—though these restrictions can be modified by police agencies purchasing the system. The underlying technology relies on the same large language model (GPT-4) known for "hallucination" problems, where AI systems confidently generate plausible but factually incorrect information.

## Accountability and Accuracy Concerns

Civil liberties advocates and legal experts raised immediate concerns that AI-generated police reports could launder false police narratives with a veneer of technological objectivity, making it harder to challenge officer testimony in court. The system requires officers to review and approve reports, but research on automation bias demonstrates that humans tend to trust AI-generated content and miss errors, particularly when under time pressure or workload stress—precisely the conditions Axon markets Draft One to address. The "82% reduction in report-writing time" suggests officers spend minimal time reviewing AI drafts, raising questions about whether meaningful human oversight occurs in practice. Defense attorneys warned that judges and juries might defer to AI-generated reports as more reliable than human-written accounts, despite the system having no independent knowledge of events and merely reformulating what officers said into formal prose.

## Deliberate Design to Prevent Transparency and Audits

An Electronic Frontier Foundation investigation in July 2025 found that Draft One was deliberately designed to avoid audits and prevent accountability. Axon intentionally does not store the original AI-generated drafts, with a company official stating "the last thing we want to do is create more disclosure headaches for our customers." Once officers paste AI-generated text into their reporting systems, there is no record indicating which portions came from AI versus human authorship, making it impossible to determine responsibility for errors, bias, or false statements. Police departments reported they "do not have the ability to create a list of reports created through Draft One. They are not searchable," preventing systematic oversight of AI-generated content. The Palm Beach County Sheriff's Office voluntarily tracked its usage, documenting over 3,000 Draft One reports generated between December 2024 and March 2025, but this transparency was exceptional rather than standard. The lack of version control and audit trails means that when police reports contain inaccuracies, inappropriate language, or misinterpretations, responsibility cannot be attributed to either the AI system or the officer—a feature, not a bug, according to civil liberties advocates.

## Bias and Interpretation Issues

Axon conducted internal bias testing and claimed that Draft One performed "equal to or better than officer-only report narratives" across completeness, neutrality, objectivity, terminology, and coherence in a double-blind study comparing AI-generated and human-written reports. However, critics noted that this standard—performing as well as human officers—was inadequate given documented patterns of bias, selective reporting, and false testimony in police reports, particularly regarding encounters with Black and Latino individuals. The AI system learns from body camera audio that reflects existing police communication patterns, including coded language, selective emphasis, and framing choices that justify police actions. By automating these patterns, Draft One risks systematizing and scaling biased reporting practices rather than correcting them, while making the biases less visible and harder to challenge because they are embedded in AI-generated language.

## Market Strategy and Ecosystem Lock-In

Draft One's rapid growth as Axon's fastest-expanding product demonstrates the company's successful strategy of integrating AI capabilities throughout its surveillance ecosystem to increase customer dependency. The system only works with Axon body cameras, Evidence.com cloud storage, and Axon Records software, creating additional barriers to switching vendors and justifying higher subscription prices for the bundled platform. Police departments that adopt Draft One become dependent on Axon's AI infrastructure for basic operational functions like report generation, making it administratively and financially prohibitive to migrate to competitors. The integration of GPT-4 positions Axon as an intermediary controlling police access to cutting-edge AI capabilities, with the company able to upgrade the underlying models, adjust pricing, or modify functionality with limited agency input. This consolidation of AI-powered police documentation in a single vendor's proprietary platform raises systemic risks about data security, algorithmic transparency, and the ability of courts and oversight bodies to audit the accuracy of AI-generated police records.

## Complete AI Surveillance Pipeline: 911 Call to Arrest Report

Draft One represents one component of a comprehensive AI-powered criminal justice pipeline that Axon is constructing through strategic acquisitions and product integration. In November 2025, Axon announced the acquisition of Carbyne, an AI-powered 911 call platform that processes over 250 million data points annually with features including live video streaming, multilingual transcription and translation, and intelligent workflow tools. Together with Axon's earlier acquisition of Prepared (another AI-powered 911 platform), these systems create an end-to-end automated infrastructure: AI processes the initial 911 call, body cameras record the police encounter, and Draft One automatically generates the incident report that determines probable cause, supports prosecution, and serves as evidence in court. This vertically integrated AI pipeline transforms critical decision points in the criminal justice system—from emergency response dispatch to arrest documentation—into algorithmic processes controlled by a single private vendor. With over 18,000 US law enforcement agencies using Axon infrastructure, the company has positioned itself as the de facto operating system for American policing, where AI-generated narratives increasingly replace human judgment in determining who gets arrested, charged, and prosecuted.
