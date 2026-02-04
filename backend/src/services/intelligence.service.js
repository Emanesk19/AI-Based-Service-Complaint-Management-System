const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const hoursLeftToDueDate = (dueDate) => {
  if (!dueDate) return null;
  return (new Date(dueDate) - new Date()) / (1000 * 60 * 60);
};

const calculateRiskScore = (ticket, stats) => {
  let score = 0;
  const reasoning = [];

  // Priority
  if (ticket.priority === "High") {
    score += 30;
    reasoning.push("High priority increases risk");
  } else if (ticket.priority === "Medium") {
    score += 15;
    reasoning.push("Medium priority increases risk slightly");
  }

  // SLA time remaining
  const hrsLeft = hoursLeftToDueDate(ticket.dueDate);
  if (hrsLeft !== null) {
    if (hrsLeft < 0) {
      score += 50;
      reasoning.push("Ticket is overdue (past due date)");
    } else if (hrsLeft < 6) {
      score += 25;
      reasoning.push("Less than 6 hours left before SLA due date");
    } else if (hrsLeft < 24) {
      score += 15;
      reasoning.push("Less than 24 hours left before SLA due date");
    }
  }

  // Status
  if (ticket.status === "Reopened") {
    score += 20;
    reasoning.push("Ticket was reopened (previous resolution failed)");
  } else if (ticket.status === "New") {
    score += 10;
    reasoning.push("Ticket is new and may be untriaged");
  }

  // Assignment
  if (!ticket.agentId) {
    score += 20;
    reasoning.push("No agent assigned yet");
  }

  // Historical adjustment (learning from your DB)
  // If reopen rate is high, increase risk globally
  if (stats?.reopenRate !== null && stats?.reopenRate > 0.15) {
    score += 5;
    reasoning.push("Historical reopen rate is high, increasing global risk");
  }

  // If average feedback is low, increase risk slightly
  if (stats?.avgFeedback !== null && stats.avgFeedback < 3.5) {
    score += 5;
    reasoning.push("Average user feedback is low, increasing caution");
  }

  score = clamp(score, 0, 100);

  // Confidence: more data = higher confidence
  // Simple heuristic: total tickets drives confidence
  const confidence = stats?.total
    ? clamp(0.4 + Math.log10(stats.total + 1) / 5, 0.4, 0.95)
    : 0.5;

  return { score, reasoning, confidence };
};

const predictSlaBreach = (riskScore) => {
  if (riskScore >= 70) return "High";
  if (riskScore >= 40) return "Medium";
  return "Low";
};

const generateRecommendation = (ticket, riskScore) => {
  const recommendations = [];

  if (!ticket.agentId) recommendations.push("Assign ticket to an agent immediately");
  if (ticket.priority === "High" && riskScore > 60) recommendations.push("Escalate ticket priority or notify supervisor");
  if (ticket.status === "Reopened") recommendations.push("Assign to a senior agent and review close reason");
  if (recommendations.length === 0) recommendations.push("No immediate action required");

  return recommendations;
};

module.exports = {
  calculateRiskScore,
  predictSlaBreach,
  generateRecommendation,
};
