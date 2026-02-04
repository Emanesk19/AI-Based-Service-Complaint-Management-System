const calculateRiskScore = (ticket) => {
  let score = 0;

  // Priority
  if (ticket.priority === "High") score += 30;
  else if (ticket.priority === "Medium") score += 15;

  // SLA time remaining
  if (ticket.dueDate) {
    const hoursLeft =
      (new Date(ticket.dueDate) - new Date()) / (1000 * 60 * 60);

    if (hoursLeft < 0) score += 50; // overdue
    else if (hoursLeft < 6) score += 25;
    else if (hoursLeft < 24) score += 15;
  }

  // Status
  if (ticket.status === "Reopened") score += 20;
  if (ticket.status === "New") score += 10;

  // Assignment
  if (!ticket.agentId) score += 20;

  return Math.min(score, 100);
};

const predictSlaBreach = (riskScore) => {
  if (riskScore >= 70) return "High";
  if (riskScore >= 40) return "Medium";
  return "Low";
};

const generateRecommendation = (ticket, riskScore) => {
  const recommendations = [];

  if (!ticket.agentId) {
    recommendations.push("Assign ticket to an agent immediately");
  }

  if (ticket.priority === "High" && riskScore > 60) {
    recommendations.push("Consider escalating this ticket");
  }

  if (ticket.status === "Reopened") {
    recommendations.push("Review previous resolution and assign senior agent");
  }

  if (recommendations.length === 0) {
    recommendations.push("No immediate action required");
  }

  return recommendations;
};

module.exports = {
  calculateRiskScore,
  predictSlaBreach,
  generateRecommendation,
};
