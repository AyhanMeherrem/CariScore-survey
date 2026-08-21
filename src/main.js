import { Model } from "survey-core";
import { renderSurvey } from "survey-js-ui";
import "survey-core/defaultV2.min.css";
import "./style.css";
import { buildSurveyJson, QUESTIONS } from "./survey-config.js";

const containerEl = document.getElementById("surveyContainer");

// Google Apps Script Web App URL that appends each participant's ratings to
// a Google Sheet — see google-apps-script/Code.gs for the server-side code
// and README section on how to deploy it. Configure via .env (VITE_RESULTS_ENDPOINT).
const RESULTS_ENDPOINT = import.meta.env.VITE_RESULTS_ENDPOINT || "";

function showError(message) {
  containerEl.innerHTML = `<div class="load-error"><p>${message}</p></div>`;
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildRatingsFromResolvedStimuli(resolvedStimuli, rawData) {
  return resolvedStimuli.map((item) => {
    const pairKey = `${item.referenceId}_${item.method}`;
    const row = {
      reference_id: item.referenceId,
      method: item.method,
      variant: item.variant,
      placeholder: !!item.placeholder,
    };
    QUESTIONS.forEach((q) => {
      row[q.name] = rawData[`${pairKey}_${q.name}`];
    });
    return row;
  });
}

async function sendResults(payload) {
  if (!RESULTS_ENDPOINT) {
    console.warn("VITE_RESULTS_ENDPOINT is not set — results cannot be sent to the server, downloading locally instead.");
    downloadJson(payload, `caricature_survey_${payload.participant_id}.json`);
    return;
  }
  try {
    // Sent as text/plain (not application/json) on purpose: this avoids a
    // CORS preflight (OPTIONS) request, which Google Apps Script Web Apps
    // don't handle. The Apps Script side parses it as JSON manually.
    const res = await fetch(RESULTS_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.error("Failed to send results to the server, falling back to a local download:", err);
    downloadJson(payload, `caricature_survey_${payload.participant_id}.json`);
  }
}

async function init() {
  let manifest;
  try {
    const res = await fetch("/stimuli-manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifest = await res.json();
  } catch (err) {
    showError(
      "Could not load stimuli-manifest.json. Run <code>npm run generate-manifest</code> first, then " +
        "restart the dev server."
    );
    console.error(err);
    return;
  }

  if (!manifest.stimuli || manifest.stimuli.length === 0) {
    showError("Manifest is empty: no valid pairs were found in the CaricatureImages folder.");
    return;
  }

  const participantId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random()}`;

  const { surveyJson, resolvedStimuli } = buildSurveyJson(manifest);
  const surveyModel = new Model(surveyJson);

  surveyModel.onComplete.add((sender) => {
    const rawData = sender.data;
    const payload = {
      participant_id: participantId,
      completed_at: new Date().toISOString(),
      ratings: buildRatingsFromResolvedStimuli(resolvedStimuli, rawData),
      raw_survey_data: rawData,
    };
    sendResults(payload);
  });

  renderSurvey(surveyModel, containerEl);
  if (import.meta.env.DEV) {
    window.__survey = surveyModel;
    window.__resolvedStimuli = resolvedStimuli;
  }
}

init();
