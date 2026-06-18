// ============================================================================
// CARBON TRACKER - STATE MANAGEMENT (STORE)
// ============================================================================
// This module provides pure functions (reducers) for managing application state.
// By decoupling state mutations from the DOM/UI, we make the logic 100% testable.

window.Store = (function() {

  /**
   * Deep clone helper to ensure pure state transitions.
   */
  function clone(state) {
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Add a new emissions entry to the log.
   */
  function addEntry(state, entry) {
    const nextState = clone(state);
    nextState.entries.push(entry);
    
    let s = window.Gamification.updateStreak(nextState);
    const result1 = window.Gamification.awardPoints(s, 'log_entry');
    s = result1.state;
    const result2 = window.Gamification.checkBadges(s);
    
    return { 
      state: result2.state, 
      pointsEarned: result1.pointsEarned, 
      newBadges: result2.newBadges 
    };
  }

  /**
   * Delete an emissions entry by ID.
   */
  function deleteEntry(state, id) {
    const nextState = clone(state);
    nextState.entries = nextState.entries.filter(e => e.id !== id);
    return { state: nextState };
  }

  /**
   * Add a new action plan goal.
   */
  function addGoal(state, goal) {
    const nextState = clone(state);
    nextState.goals.push(goal);
    
    const result1 = window.Gamification.awardPoints(nextState, 'create_goal');
    let s = result1.state;
    const result2 = window.Gamification.checkBadges(s);
    
    return {
      state: result2.state,
      pointsEarned: result1.pointsEarned,
      newBadges: result2.newBadges
    };
  }

  /**
   * Delete a goal by ID.
   */
  function deleteGoal(state, id) {
    const nextState = clone(state);
    nextState.goals = nextState.goals.filter(g => g.id !== id);
    return { state: nextState };
  }

  /**
   * Toggle the completion status of a goal milestone.
   * Awards points on completion.
   */
  function toggleMilestone(state, goalId, milestoneIdx) {
    const nextState = clone(state);
    const goal = nextState.goals.find(g => g.id === goalId);
    if (!goal || !goal.milestones[milestoneIdx]) return { state: nextState, pointsEarned: 0, newBadges: [], goalCompleted: false };

    const wasDone = goal.milestones[milestoneIdx].done;
    goal.milestones[milestoneIdx].done = !wasDone;

    // Award points only if marking as done
    if (!wasDone) {
      const result1 = window.Gamification.awardPoints(nextState, 'complete_milestone');
      let s = result1.state;
      const result2 = window.Gamification.checkBadges(s);
      
      // Check if goal is fully complete
      const allDone = goal.milestones.every(m => m.done);
      if (allDone) {
        const result3 = window.Gamification.awardPoints(result2.state, 'complete_goal');
        const result4 = window.Gamification.checkBadges(result3.state);
        return {
          state: result4.state,
          pointsEarned: result1.pointsEarned + result3.pointsEarned,
          newBadges: [...result2.newBadges, ...result4.newBadges],
          goalCompleted: true
        };
      }
      
      return {
        state: result2.state,
        pointsEarned: result1.pointsEarned,
        newBadges: result2.newBadges,
        goalCompleted: false
      };
    }
    
    return { state: nextState, pointsEarned: 0, newBadges: [], goalCompleted: false };
  }

  return {
    addEntry,
    deleteEntry,
    addGoal,
    deleteGoal,
    toggleMilestone
  };
})();
