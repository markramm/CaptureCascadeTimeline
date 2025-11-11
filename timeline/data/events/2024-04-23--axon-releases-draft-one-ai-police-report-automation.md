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
actors:
- Axon
- OpenAI
- Microsoft
sources:
- url: https://investor.axon.com/2024-04-23-Axon-reimagines-report-writing-with-Draft-One,-a-first-of-its-kind-AI-powered-force-multiplier-for-public-safety
  title: Axon reimagines report writing with Draft One, a first-of-its-kind AI-powered force multiplier for public safety
  publisher: Axon Investor Relations
  date: '2024-04-23'
  tier: 2
- url: https://www.cnn.com/2025/08/12/tech/ai-police-reports-axon
  title: How AI is being used by police departments to help draft reports
  publisher: CNN
  date: '2025-08-12'
  tier: 1
- url: https://www.axon.com/products/draft-one
  title: Draft One Product Overview
  publisher: Axon
  date: '2024-04-23'
  tier: 2
status: confirmed
---

On April 23, 2024, Axon released Draft One, an AI-powered system that automatically generates police report narratives from body-worn camera audio using OpenAI's GPT-4 Turbo model built on Microsoft Azure infrastructure. The system transcribes audio from Axon Body 3 and 4 cameras uploaded over LTE and produces complete report drafts within five minutes of an incident ending, with Axon claiming officers can save approximately one hour per day on paperwork and some agencies reporting up to 82% reduction in report-writing time. Draft One rapidly became Axon's fastest-growing product, demonstrating strong demand for AI automation of police documentation despite significant concerns about accuracy, bias, and the potential for AI-generated reports to legitimize false police narratives.

## Technical Implementation and Capabilities

Draft One leverages body camera audio that is automatically uploaded to the cloud and transcribed, using GPT-4 Turbo to generate complete incident narratives from the transcribed conversations, observations, and interactions. The system integrates seamlessly with Axon Body cameras, Evidence.com cloud storage, and Axon Records management systems, creating an end-to-end automated pipeline from incident capture to report filing. Officers can edit drafts before submission, and the system includes placeholders that require active completion to prevent fully automated report generation. Axon configured the default settings to limit report drafts to minor incidents and misdemeanors, specifically excluding incidents involving arrests and felonies—though these restrictions can be modified by police agencies purchasing the system. The underlying technology relies on the same large language model (GPT-4) known for "hallucination" problems, where AI systems confidently generate plausible but factually incorrect information.

## Accountability and Accuracy Concerns

Civil liberties advocates and legal experts raised immediate concerns that AI-generated police reports could launder false police narratives with a veneer of technological objectivity, making it harder to challenge officer testimony in court. The system requires officers to review and approve reports, but research on automation bias demonstrates that humans tend to trust AI-generated content and miss errors, particularly when under time pressure or workload stress—precisely the conditions Axon markets Draft One to address. The "82% reduction in report-writing time" suggests officers spend minimal time reviewing AI drafts, raising questions about whether meaningful human oversight occurs in practice. Defense attorneys warned that judges and juries might defer to AI-generated reports as more reliable than human-written accounts, despite the system having no independent knowledge of events and merely reformulating what officers said into formal prose.

## Bias and Interpretation Issues

Axon conducted internal bias testing and claimed that Draft One performed "equal to or better than officer-only report narratives" across completeness, neutrality, objectivity, terminology, and coherence in a double-blind study comparing AI-generated and human-written reports. However, critics noted that this standard—performing as well as human officers—was inadequate given documented patterns of bias, selective reporting, and false testimony in police reports, particularly regarding encounters with Black and Latino individuals. The AI system learns from body camera audio that reflects existing police communication patterns, including coded language, selective emphasis, and framing choices that justify police actions. By automating these patterns, Draft One risks systematizing and scaling biased reporting practices rather than correcting them, while making the biases less visible and harder to challenge because they are embedded in AI-generated language.

## Market Strategy and Ecosystem Lock-In

Draft One's rapid growth as Axon's fastest-expanding product demonstrates the company's successful strategy of integrating AI capabilities throughout its surveillance ecosystem to increase customer dependency. The system only works with Axon body cameras, Evidence.com cloud storage, and Axon Records software, creating additional barriers to switching vendors and justifying higher subscription prices for the bundled platform. Police departments that adopt Draft One become dependent on Axon's AI infrastructure for basic operational functions like report generation, making it administratively and financially prohibitive to migrate to competitors. The integration of GPT-4 positions Axon as an intermediary controlling police access to cutting-edge AI capabilities, with the company able to upgrade the underlying models, adjust pricing, or modify functionality with limited agency input. This consolidation of AI-powered police documentation in a single vendor's proprietary platform raises systemic risks about data security, algorithmic transparency, and the ability of courts and oversight bodies to audit the accuracy of AI-generated police records.
