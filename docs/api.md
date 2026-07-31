# ORION AI Command Reference

ORION AI is the natural-language front end to the simulation engine. It interprets directives, orchestrates the six simulated agent cores, and returns structured replies with follow-up suggestions.

## Interpreter entry point

```js
import { handleCommand } from '../src/core/orionAI'

const reply = await handleCommand('Scan the Pacific Ocean for unusual structures.')
// {
//   title: 'PACIFIC OCEAN SWEEP COMPLETE',
//   body: 'Delegated to Ocean Research Agent and Satellite Analyst Agent...',
//   chips: ['Show high-confidence events worldwide', '...'],
//   focus: { lat, lon }   // optional — asks the globe to report a new sector
// }
```

Replies are plain objects; the `OrionPanel` component renders them as messages. `chips` become clickable suggestions, and `focus` re-arms the scan-sector readout.

## Command patterns

Matching is keyword-based and order-insensitive. Branches are evaluated in priority order.

| Directive             | Matchers                                                          | Behavior                                                                     |
| --------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Ocean sector sweep    | `pacific`/`atlantic`/`indian`/… **and** `scan`/`analyze`/`search` | Spawns 3–6 new anomalies near the requested region and summarizes confidence |
| Temporal comparison   | `compare`/`history`/`historical`/`20 years`                       | Simulated 20-year archive synthesis; accepts a region name                   |
| Focused investigation | `investigate`/`inspect`/`zoom`/`look at`                          | Adds an orbital tasking narrative and a focus cooldown                       |
| Global event register | `unexplained`/`high-confidence`/`worldwide`                       | Filters current anomalies at confidence ≥ 75%                                |
| UAP analysis          | `uap`/`ufo`/`aerial`/`atmospheric`                                | Spawns an `ATMOSPHERIC_UAP` event and opens the UAP module                   |
| Seafloor analysis     | `ocean floor`/`seafloor`/`bathymetry`/`depth`                     | Spawns an `OCEAN_FLOOR` event; suggests ocean mode                           |
| Marine biomass        | `wildlife`/`migration`/`creature`/`marine life`                   | Simulated acoustic/biomass synthesis                                         |
| Thermal mapping       | `thermal`/`heat`/`infrared`/`volcanic`                            | Infrared composite summary                                                   |
| System status         | `status`/`diagnostic`/`health`                                    | Live counts + GPU readout                                                    |
| Help                  | `help`/`commands`                                                 | Full capability list                                                         |
| Fallback              | —                                                                 | Acknowledges and suggests valid directives                                   |

## Example conversation

```text
User:   Scan the Pacific Ocean for unusual structures.
ORION:  PACIFIC OCEAN SWEEP COMPLETE
        Scanned ~1.28e8 km² across 12 multispectral bands, SAR and
        bathymetric grids. Detected 4 candidate signatures. Highest
        confidence: ocean floor abnormality mapped in the Philippine Sea
        (87%). Confidence is provisional — competing explanations listed.

User:   Show unexplained high-confidence events worldwide.
ORION:  HIGH-CONFIDENCE EVENT REGISTER
        Filtering the global register by confidence ≥ 75%: 5 events stand
        out. All remain under review — no conclusion presented as fact.
```

## The six agent cores

Every investigation is attributed to a combination of:

1. **Satellite Analyst Agent** — orbital imaging, multispectral/SAR change.
2. **Ocean Research Agent** — bathymetry, currents, acoustic data.
3. **Atmospheric Agent** — weather correlation, trajectory physics.
4. **Geological Agent** — terrain, tectonics, mineralogy.
5. **Wildlife Agent** — biomass, migration, bio-acoustic classification.
6. **Verification Agent** — cross-source validation; always the final node.

The agent pipeline is surfaced on each event panel (`AGENT VERIFICATION PIPELINE`) and terminates with the Verification Agent — no finding is "final" without it.

## Extending the interpreter

1. Add a matcher to `MATCH` in `src/core/orionAI.js`.
2. Add a branch above the fallback in `handleCommand`.
3. Return a reply object; add `chips` and an optional `focus`.
4. Add a unit test in `src/core/orionAI.test.js`.

## Voice input

The `OrionPanel` uses the Web Speech API (`window.SpeechRecognition`) when available. If unsupported, the UI reports it and falls back to typing. Voice is a convenience layer only — it does not change interpreter behavior.
