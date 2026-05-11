Dorset Housing Affordability Scrollytelling Project

Build a production-quality scrollytelling web page using SvelteKit inspired by the style and interaction patterns used by the UK Office for National Statistics (ONS).

Primary references:

ONS Svelte Scrolly template: https://github.com/ONSvisual/svelte-scrolly
ONS scrollytelling technical blog: https://digitalblog.ons.gov.uk/2021/06/02/how-we-build-scrollytelling-articles/
ONS Svelte Scrolly demo: https://onsvisual.github.io/svelte-scrolly/
ONS Svelte maps: https://github.com/ONSdigital/svelte-maps

The page should feel editorial, narrative-driven, highly visual and data-journalistic rather than dashboard-like.

The project should use:

SvelteKit
TypeScript
D3 where useful
MapLibre or Leaflet for maps
TailwindCSS
responsive layouts
scroll-triggered transitions and animations
accessible colour palettes
mobile-first responsive design

The final product should resemble a modern ONS interactive article.

Project Goal

Tell the story of housing affordability across Dorset at MSOA level.

The narrative should:

Begin at a broad national/regional context.
Gradually zoom into Dorset.
Reveal large internal inequalities within Dorset.
Explore the role of rurality, coastal geography and ageing populations.
Reveal the surprising finding that some coastal and urban flat markets remain comparatively accessible for younger buyers.
End with a nuanced conclusion that Dorset is not one housing market, but several overlapping housing systems.

The experience should feel exploratory and reveal insights progressively through scrolling.

Editorial Tone

Tone should be:

analytical
calm
evidence-led
journalistic
non-political
visually clean
restrained rather than flashy

Avoid:

excessive animation
dashboard aesthetics
bright saturated colours
clutter
excessive controls

Use:

whitespace
subtle transitions
sticky visualisations
gradual reveals
annotation-driven storytelling
Core Narrative Structure
Section 1 — Hero Introduction

Full-screen opening section.

Background:

subtle animated Dorset map outline
slow parallax effect
muted housing imagery or abstract map texture

Headline:
“Can local people still afford to buy homes in Dorset?”

Subheading:
“Housing affordability varies dramatically across Dorset’s neighbourhoods — from relatively accessible coastal towns to rural areas where homes cost nearly 20 times annual earnings.”

Scroll hint indicator.

As user scrolls:

Dorset map fades into view
affordability gradient gradually appears
Section 2 — Dorset in National Context

Goal:
Show Dorset is less affordable than England and the South West overall.

Visual:
Animated bar chart or slope chart comparing:

England
South West
Dorset

Metrics:

median affordability ratio
lower quartile affordability ratio

Narrative points:

Dorset substantially exceeds national affordability levels
lower-income households are especially affected

Animation:
Bars animate upward as section enters viewport.

Section 3 — Zoom Into Dorset

Sticky map section.

Visual:
Choropleth MSOA map of Dorset.

Colour scale:
light → dark based on affordability ratio.

As user scrolls through captions:

Introduce affordability variation.
Highlight least affordable areas.
Highlight more affordable areas.
Emphasise internal inequality.

Key insight:
The gap between Dorset MSOAs is extremely large.

Interactive behaviour:

map zooms/pans smoothly
highlighted MSOAs animate
labels fade in/out

Important MSOAs to highlight:

St Leonards
Lyme Regis, Charmouth & Marshwood Vale
Corfe Castle & Langton Matravers
Weymouth Town, Melcombe Regis & Rodwell
Underhill & The Grove
Section 4 — The Rural Affordability Problem

Key insight:
Rural Dorset is less affordable than urban Dorset.

Visual:
Split-screen comparison.

Left:
rural affordability distribution.

Right:
urban affordability distribution.

Possible chart types:

violin plot
beeswarm
boxplot

Narrative:

rural areas consistently show higher affordability ratios
affordability pressure is not centred on large towns
lifestyle demand and constrained supply likely drivers

Scroll-triggered annotations:

median rural value appears
then urban value
then gap highlighted visually

Add subtle map overlays showing rural classifications.

Section 5 — Coastal Dorset Is Divided

Key insight:
Coastal Dorset is not uniformly expensive.

Visual:
Animated coastal/inland comparison map.

Narrative structure:

User expects coast = expensive.
Reveal split coastal reality.
Explain affluent amenity coast vs working coastal towns.

Use examples:

Lyme Regis
Corfe Castle area
Weymouth
Portland

Possible visual:
scatter plot:

x-axis = affordability ratio
y-axis = coastal/inland
coloured by urban/rural

Reveal:
Weymouth and Portland act as affordability “pressure valves”.

This section should feel slightly surprising.

Section 6 — Ageing and Affordability

Key insight:
Older populations strongly overlap with high affordability pressures.

Visual:
Scatter plot.

Axes:

x = % aged 65+
y = affordability ratio

Animate dots into place.

Highlight:

St Leonards
Lyme Regis
Corfe Castle
Portland comparison areas

Narrative:

retirement migration
downsizing demand
amenity-driven housing markets
wealth concentration

Add subtle trendline.

Important:
Avoid overstating causation.

Frame as:
“areas with older populations also tend to…”

Section 7 — Housing Type Changes the Story

This is the major narrative twist.

Key insight:
Headline affordability figures conceal important differences in flat markets.

Visual sequence:
Initial chart:
overall affordability ratios.

Then transition:
toggle/morph into flat affordability.

Goal:
Reveal some places become much more accessible when flats are isolated.

Narrative:

detached housing dominates many Dorset markets
flats can remain comparatively accessible
but not everywhere

Show:

Weymouth and Portland flat markets relatively affordable
rural areas often lack affordable smaller dwellings entirely
some retirement areas still have expensive flats

Suggested visual:
small multiples by dwelling type:

detached
semi-detached
terraced
flats

Animation:
smooth morph transitions between dwelling types.

This section should feel like a reframing of the earlier story.

Section 8 — Dorset’s Multiple Housing Systems

Synthesis section.

Visual:
Clustered typology map or grouped cards.

Define three housing systems:

1. Rural Lifestyle Markets
expensive detached housing
ageing populations
limited flat stock
exclusionary affordability
2. Urban/Working Coastal Markets
lower-cost flats and terraces
mixed tenure
entry-level ownership opportunities
3. Retirement & Amenity Apartment Markets
expensive flats
downsizer demand
second-home influence

Use subtle animated transitions between categories.

Section 9 — Conclusion

Minimalist ending.

Return to simplified Dorset map.

Key concluding text:
“Dorset’s housing market is not a single system. Affordability depends not only on location, but on age, rurality, housing mix and the type of homes available.”

Final takeaway bullets:

rural Dorset faces strongest affordability pressures
coastal Dorset contains very different housing markets
flats partially soften affordability barriers in some towns
younger buyers face very different prospects depending on local housing mix

Optional:
small methodology/details accordion.


Pre-process:

affordability
dwelling-type affordability
age structure
coastal classification
rural/urban classification

Use TypeScript interfaces.

Suggested Component Structure

/src/lib/components/

Components:

Hero.svelte
StickyScroller.svelte
DorsetMap.svelte
AffordabilityBars.svelte
ScatterPlot.svelte
HousingTypeMorphChart.svelte
TypologyCards.svelte
Annotation.svelte
Tooltip.svelte
Visual Design

Style should resemble:

ONS interactives
Financial Times visual stories
modern data journalism

Use:

muted palette
off-white backgrounds
dark grey typography
restrained accent colours

Accessibility:

WCAG compliant contrast
keyboard accessible
reduced-motion support

Typography:

strong editorial headline hierarchy
readable body text
generous spacing
Animation Guidance

Animations should:

support understanding
feel smooth and subtle
avoid gimmicks

Prefer:

fades
opacity transitions
position interpolation
chart morphing
map highlighting

Avoid:

bounce effects
exaggerated easing
rapid motion
Mobile Behaviour

Mobile experience is critical.

On mobile:

sticky graphics should resize intelligently
maps should simplify labels
annotations should stack vertically
avoid tiny hover interactions

Desktop:

sticky side-by-side narrative panels
larger immersive map sections
Deliverables

Generate:

SvelteKit project structure
All major Svelte components
Example data-loading architecture
Scroll interaction system
Responsive layouts
Styling system
Narrative placeholder copy
Animation scaffolding
Reusable chart utilities

Use clean, maintainable, well-commented code.

The result should feel like a polished interactive data-journalism feature rather than a dashboard or BI report.