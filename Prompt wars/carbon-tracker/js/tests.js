// ============================================================================
// CARBON TRACKER - TEST SUITE
// ============================================================================

describe('Security Utility Tests', () => {
  describe('escapeHtml()', () => {
    it('should escape basic HTML tags', () => {
      expect(Security.escapeHtml('<h1>Test</h1>')).to.equal('&lt;h1&gt;Test&lt;/h1&gt;');
    });

    it('should escape script tags with attributes', () => {
      const input = '<script src="malicious.js"></script>';
      const expected = '&lt;script src=&quot;malicious.js&quot;&gt;&lt;/script&gt;';
      expect(Security.escapeHtml(input)).to.equal(expected);
    });

    it('should handle undefined and null inputs safely', () => {
      expect(Security.escapeHtml(null)).to.equal('');
      expect(Security.escapeHtml(undefined)).to.equal('');
    });
  });

  describe('validateNumericInput()', () => {
    it('should return valid numbers within range', () => {
      expect(Security.validateNumericInput(50, 0, 100, 0)).to.equal(50);
    });

    it('should return default value for NaN inputs', () => {
      expect(Security.validateNumericInput('abc', 0, 100, 10)).to.equal(10);
    });

    it('should return default value for numbers outside of range', () => {
      expect(Security.validateNumericInput(150, 0, 100, 10)).to.equal(10);
      expect(Security.validateNumericInput(-50, 0, 100, 10)).to.equal(10);
    });
  });

  describe('validateStringInput()', () => {
    it('should truncate strings exceeding maxlength', () => {
      const input = 'a'.repeat(200);
      expect(Security.validateStringInput(input, 100, '')).to.have.lengthOf(100);
    });

    it('should return default value for empty strings', () => {
      expect(Security.validateStringInput('   ', 100, 'default')).to.equal('default');
    });
  });
});

describe('Calculator Tests', () => {
  describe('calculate()', () => {
    it('should correctly calculate transport emissions', () => {
      // EV: value * 0.05
      const co2 = window.Calc.calculate('transport', 'ev', 10);
      expect(co2).to.equal(0.5);
    });

    it('should default to 0 for invalid subtypes', () => {
      const co2 = window.Calc.calculate('transport', 'spaceship', 10);
      expect(co2).to.equal(0);
    });

    it('should correctly calculate flight emissions using distance thresholds', () => {
      // < 500 = value * 0.25
      const shortFlight = window.Calc.calculate('flight', 'flight', 400);
      expect(shortFlight).to.equal(100);

      // > 2000 = value * 0.15
      const longFlight = window.Calc.calculate('flight', 'flight', 3000);
      expect(longFlight).to.equal(450);
    });
  });

  describe('byCategory()', () => {
    it('should aggregate emissions by category from entries array', () => {
      const entries = [
        { category: 'transport', co2: 10 },
        { category: 'transport', co2: 15 },
        { category: 'food', co2: 5 }
      ];
      const result = window.Calc.byCategory(entries);
      expect(result.transport).to.equal(25);
      expect(result.food).to.equal(5);
      expect(result.home).to.equal(0);
    });
    
    it('should ignore prototype pollution attempts in entries', () => {
      const entries = [
        { category: '__proto__', co2: 100 },
        { category: 'constructor', co2: 100 }
      ];
      const result = window.Calc.byCategory(entries);
      expect(result.__proto__).to.be.undefined;
    });
  });
});

describe('Gamification Tests', () => {
  let mockState;
  
  beforeEach(() => {
    // Reset state before each test
    mockState = {
      user: { points: 0, level: 1, streak: 0, lastLogin: null },
      badges: []
    };
  });

  describe('awardPoints()', () => {
    it('should award correct points for actions', () => {
      const { state, pointsEarned } = window.Gamification.awardPoints(mockState, 'log_entry');
      expect(pointsEarned).to.equal(10);
      expect(state.user.points).to.equal(10);
    });

    it('should trigger a level up if points exceed threshold', () => {
      mockState.user.points = 90; // Next level at 100
      const { state } = window.Gamification.awardPoints(mockState, 'log_entry'); // +10
      expect(state.user.level).to.equal(2);
      expect(state.user.points).to.equal(100);
    });
  });
  
  describe('checkBadges()', () => {
    it('should award First Step badge on first log', () => {
      mockState.entries = [{ id: '1' }]; // 1 entry
      const { state, newBadges } = window.Gamification.checkBadges(mockState);
      
      expect(newBadges).to.have.lengthOf(1);
      expect(newBadges[0].id).to.equal('first_step');
      expect(state.badges).to.include('first_step');
    });
  });
});

describe('Store Tests (State Management)', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      user: { points: 0, level: 1, streak: 0 },
      badges: [],
      entries: [],
      goals: []
    };
  });

  it('addEntry() should add entry, award points, and check badges', () => {
    const entry = { id: 'test_1', co2: 10, category: 'transport' };
    const { state, pointsEarned, newBadges } = window.Store.addEntry(initialState, entry);
    
    expect(state.entries).to.have.lengthOf(1);
    expect(state.entries[0].id).to.equal('test_1');
    expect(pointsEarned).to.be.greaterThan(0);
    // Since it's the first entry, Gamification should award the First Step badge
    expect(newBadges).to.have.lengthOf(1);
  });

  it('deleteEntry() should remove an entry by ID without affecting others', () => {
    initialState.entries = [{ id: '1' }, { id: '2' }];
    const { state } = window.Store.deleteEntry(initialState, '1');
    expect(state.entries).to.have.lengthOf(1);
    expect(state.entries[0].id).to.equal('2');
  });

  it('addGoal() should add goal and award points', () => {
    const goal = { id: 'g1', title: 'Test Goal' };
    const { state, pointsEarned } = window.Store.addGoal(initialState, goal);
    expect(state.goals).to.have.lengthOf(1);
    expect(state.goals[0].id).to.equal('g1');
    expect(pointsEarned).to.be.greaterThan(0);
  });

  it('deleteGoal() should remove a goal by ID', () => {
    initialState.goals = [{ id: 'g1' }];
    const { state } = window.Store.deleteGoal(initialState, 'g1');
    expect(state.goals).to.have.lengthOf(0);
  });

  it('toggleMilestone() should toggle milestone status and award points when done', () => {
    initialState.goals = [{
      id: 'g1',
      milestones: [{ done: false }, { done: false }]
    }];

    // Toggle on
    const result1 = window.Store.toggleMilestone(initialState, 'g1', 0);
    expect(result1.state.goals[0].milestones[0].done).to.be.true;
    expect(result1.pointsEarned).to.be.greaterThan(0);
    expect(result1.goalCompleted).to.be.false;

    // Toggle off
    const result2 = window.Store.toggleMilestone(result1.state, 'g1', 0);
    expect(result2.state.goals[0].milestones[0].done).to.be.false;
    expect(result2.pointsEarned).to.equal(0); // No points for unchecking
  });

  it('toggleMilestone() should detect when goal is fully completed', () => {
    initialState.goals = [{
      id: 'g1',
      milestones: [{ done: true }, { done: false }]
    }];

    // Complete the final milestone
    const result = window.Store.toggleMilestone(initialState, 'g1', 1);
    expect(result.state.goals[0].milestones[1].done).to.be.true;
    expect(result.goalCompleted).to.be.true;
    // Should get points for milestone AND goal completion
    expect(result.pointsEarned).to.be.greaterThan(10); // Typically 10 for milestone, 50 for goal
  });
});
