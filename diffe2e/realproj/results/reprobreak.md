# ReproBreak adapter

STATUS: SKIPPED

Reason: REPRO_BREAK_URL not configured. The deterministic repair pipeline (pipeline/src/repair.mjs) is validated on the controlled subject (RQ3). To run on ReproBreak, set REPRO_BREAK_URL to a clone-able repo of broken/fixed (old,new) source + spec pairs; this adapter will apply repair() to each broken spec and report fix-rate.
