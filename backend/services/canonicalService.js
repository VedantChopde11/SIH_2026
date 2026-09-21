/**
 * canonicalService.js
 * Builds standardized, logical string representations of events and activities
 * for embedding and semantic search. Inspired by Constra architecture.
 */

function buildActivityCanonicalText(activity) {
  const {
    activity_id_original,
    activity_name,
    discipline,
    location,
    wbs_code,
    wbs_name
  } = activity;

  const parts = [];

  if (activity_id_original) {
    parts.push(`Activity ID: ${activity_id_original}.`);
  }
  
  if (activity_name) {
    parts.push(`Activity: ${activity_name}.`);
  }

  if (discipline) {
    parts.push(`Discipline: ${discipline}.`);
  }

  if (location) {
    parts.push(`Location: ${location}.`);
  }

  if (wbs_code && wbs_name) {
    parts.push(`WBS: ${wbs_code} ${wbs_name}.`);
  } else if (wbs_code) {
    parts.push(`WBS: ${wbs_code}.`);
  } else if (wbs_name) {
    parts.push(`WBS: ${wbs_name}.`);
  }

  return parts.join(' ');
}

function buildEventCanonicalText(event) {
  const {
    action,
    object,
    location,
    discipline,
    status,
    quantity,
    unit
  } = event;

  const parts = [];

  // Combine action and object for a more natural sentence if both exist
  if (action && object) {
    parts.push(`Activity: ${action} ${object}.`);
  } else if (action) {
    parts.push(`Activity: ${action}.`);
  } else if (object) {
    parts.push(`Activity: ${object}.`);
  }

  if (discipline) {
    parts.push(`Discipline: ${discipline}.`);
  }

  if (location) {
    parts.push(`Location: ${location}.`);
  }

  if (status) {
    parts.push(`Status: ${status}.`);
  }

  if (quantity !== undefined && quantity !== null) {
    if (unit) {
      parts.push(`Quantity: ${quantity} ${unit}.`);
    } else {
      parts.push(`Quantity: ${quantity}.`);
    }
  }

  return parts.join(' ');
}

module.exports = {
  buildActivityCanonicalText,
  buildEventCanonicalText
};
