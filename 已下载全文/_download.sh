#!/usr/bin/env bash
# 仅下载 arXiv 开放获取 PDF（合法）。失败项写入 _failed.txt，供人工复查。
set -u
cd "$(dirname "$0")"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
: > _failed.txt
: > _ok.txt

dl () {
  local id="$1"; local name="$2"
  local out="${name}.pdf"
  if [ -s "$out" ] && head -c4 "$out" | grep -q "%PDF"; then
    echo "SKIP(existing) $out"; echo "$out" >> _ok.txt; return
  fi
  curl -sL -A "$UA" --max-time 120 -o "$out" "https://arxiv.org/pdf/${id}"
  if [ -s "$out" ] && head -c4 "$out" | grep -q "%PDF"; then
    echo "OK   $out"; echo "$out" >> _ok.txt
  else
    echo "FAIL $out ($id)"; echo "$id  $out" >> _failed.txt; rm -f "$out"
  fi
  sleep 1
}

# ===== A 类：核心文献 =====
dl 2503.14924 "A01_UTFix"
dl 2402.00097 "A02_SymPrompt_CodeAwarePrompting"
dl 2501.11086 "A03_CanLLM-Gen-RegressionTests-Commits"
dl 2503.18597 "A04_Testora"
dl 2405.00874 "A05_AI-VisualChangeDetection"
dl 2408.01894 "A06_AutoE2E_FeatureDriven-E2E"
dl 2506.02529 "A07_E2E-ScreenTransitionGraphs"
dl 2506.05079 "A08_ScenarioGuided-GUI"
dl 2510.01024 "A09_GenIA-E2ETest"
dl 2605.01471 "A10_PracticalLimits-AutonomousTestRepair-Playwright"
dl 2401.06765 "A11_TaRGET-TestCaseRepair"
dl 2402.09745 "A13_WEFix"
dl 2407.03625 "A14_FixTheTests"
dl 2509.24419 "A15_UnitTestUpdate"
dl 2312.05778 "A16_GuidingChatGPT-FixWebUITests"
dl 2305.08592 "A17_TimeBasedRepair-AsyncWait"

# ===== B 类：支撑文献 =====
dl 2410.21798 "B01_iJaCoCo"
dl 2501.11550 "B07_PipelineAware-RTS"
dl 2302.06527 "B09_EmpiricalEval-LLM-UnitTest"
dl 2304.10384 "B10_CodaMosa"
dl 2305.04764 "B11_ChatUniTest"
dl 2308.16557 "B12_EffectiveTestGen-Mutation"
dl 2307.00588 "B13_ChatGPT-vs-SBST"
dl 2310.01602 "B14_CAT-LM"
dl 2406.12952 "B15_SWT-Bench"
dl 2402.09171 "B16_TestGen-LLM-Meta"
dl 2309.13574 "B17_LLM-TestScript-Gen-Migration"
dl 2309.09308 "B18_GAMMA"
dl 2307.00012 "B19_FlakyFix"
dl 2307.14733 "B20_StubCoder"
dl 2408.06224 "B22_GreyLiterature-AI-TestAutomation"
dl 2409.06416 "B23_LLM-IndustrialTestMaintenance"
dl 2307.07221 "B24_LLM-SoftwareTesting-Survey"
dl 2503.05378 "B25_WebTesting-Survey"
dl 2310.13518 "B27_VisionGUI-Survey"
dl 2411.07586 "B28_APR-CodeGen-Survey"
dl 2402.06111 "B29_TestGen-Meta-Observation"

# ===== C 类：最新前沿 =====
dl 2601.10942 "C01_ChaCo-PR-RegressionAugmentation"
dl 2605.25285 "C02_PR-Aware-UnitTestGen"
dl 2601.22832 "C03_JustInTime-CatchingTest-Meta"
dl 2508.01255 "C04_TestWeaver"
dl 2603.23443 "C05_EvaluatingLLM-TestGen-Evolution"
dl 2603.15611 "C06_Code-A1-Adversarial"
dl 2605.12158 "C07_ReproBreak-LocatorBreaks"
dl 2511.14002 "C08_FlakyGuard"
dl 2507.18316 "C09_YATE-TestRepair"
dl 2506.24015 "C10_HierarchicalKnowledge-APR"
dl 2506.04161 "C11_VISCA"
dl 2504.16753 "C12_ViMoTest"
dl 2604.02079 "C13_MalleableMobile-FunctionalTesting"
dl 2604.03438 "C14_Android-Instrumentation-CI"
dl 2601.03556 "C15_AgenticPR-TestCode"
dl 2605.25356 "C16_NameRTS-Python"
dl 2511.02810 "C17_Formalizing-RegressionTesting"
dl 2506.08311 "C18_APR-Agents-Traceability"

echo "----- DONE -----"
echo "OK:   $(wc -l < _ok.txt)"
echo "FAIL: $(wc -l < _failed.txt)"
