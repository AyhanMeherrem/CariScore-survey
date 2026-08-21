export const QUESTIONS = [
  {
    name: "recognizability",
    title:
      "How recognizable is the person in the generated caricature as the same person shown in the reference photograph?",
  },
  {
    name: "distinctive_exaggeration",
    title:
      "How well does the generated caricature exaggerate the facial characteristics that distinguish this person from an average face?",
  },
  {
    name: "genuine_distinctiveness",
    title:
      "How well does the caricature exaggerate the features that are genuinely distinctive to this person, rather than introducing arbitrary facial distortions?",
  },
];

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomVariant(item) {
  const variants = item.variants && item.variants.length ? item.variants : [{ variant: "", image: "" }];
  const chosen = variants[Math.floor(Math.random() * variants.length)];
  return {
    referenceId: item.referenceId,
    method: item.method,
    placeholder: !!item.placeholder,
    variant: chosen.variant,
    image: chosen.image,
  };
}

function buildCaricaturePage(referenceImage, resolvedItem, posInRef, totalInRef, refIndex, totalRefs) {
  const pairKey = `${resolvedItem.referenceId}_${resolvedItem.method}`;
  return {
    name: `page_${pairKey}`,
    title: `Reference ${refIndex + 1}/${totalRefs} — Caricature ${posInRef + 1}/${totalInRef}`,
    elements: [
      {
        type: "html",
        name: `img_${pairKey}`,
        html: `
          <div class="image-compare">
            <div class="image-compare__col">
              <div class="image-compare__label">Reference Photo</div>
              <img src="/${referenceImage}" class="image-compare__img" alt="Reference photo" />
            </div>
            <div class="image-compare__col">
              <div class="image-compare__label">Caricature</div>
              <img src="/${resolvedItem.image}" class="image-compare__img" alt="Caricature" />
            </div>
          </div>`,
      },
      ...QUESTIONS.map((q) => ({
        type: "rating",
        name: `${pairKey}_${q.name}`,
        title: q.title,
        rateMin: 1,
        rateMax: 5,
        minRateDescription: "Strongly Disagree",
        maxRateDescription: "Strongly Agree",
        isRequired: true,
      })),
    ],
  };
}

// Builds a fresh, per-participant-randomized SurveyJS schema from the manifest.
// - Reference (person) blocks are shuffled too, so it's not always the same
//   person shown first (avoids first-position bias).
// - Within each reference block, the method order is shuffled independently.
// - When a (reference, method) pair has multiple seed variants, one is picked
//   at random per participant.
// Returns { surveyJson, resolvedStimuli } — resolvedStimuli records exactly
// which seed variant was shown for each pair, so the export can report it
// (must be built once here and reused, not re-randomized at export time).
export function buildSurveyJson(manifest) {
  const byReference = new Map();
  manifest.stimuli.forEach((item) => {
    if (!byReference.has(item.referenceId)) byReference.set(item.referenceId, []);
    byReference.get(item.referenceId).push(item);
  });

  const shuffledReferences = shuffle(manifest.references);
  const pages = [];
  const resolvedStimuli = [];

  shuffledReferences.forEach((ref, refIndex) => {
    const items = shuffle(byReference.get(ref.id) || []).map(pickRandomVariant);
    items.forEach((resolvedItem, i) => {
      resolvedStimuli.push(resolvedItem);
      pages.push(
        buildCaricaturePage(ref.referenceImage, resolvedItem, i, items.length, refIndex, shuffledReferences.length)
      );
    });
  });

  const surveyJson = {
    title: "Caricature Evaluation Survey",
    showProgressBar: "top",
    showQuestionNumbers: "off",
    pages,
  };

  return { surveyJson, resolvedStimuli };
}
