"""
Math validation service using SymPy for symbolic mathematics.

This module provides mathematical expression parsing and validation
to check if student solution steps are mathematically correct.
"""

from sympy import sympify, simplify, SympifyError
from sympy.core.expr import Expr
from typing import Dict


class ParseError(Exception):
    """Exception raised when a mathematical expression cannot be parsed."""
    pass


class MathValidator:
    """
    Service for validating mathematical expressions and solution steps.
    
    Uses SymPy to parse and compare mathematical expressions to determine
    if a student's step is a valid transformation of the original problem.
    """
    
    def __init__(self):
        """Initialize the MathValidator."""
        pass
    
    def validate_step(self, problem: str, student_step: str) -> Dict[str, any]:
        """
        Validate if student's step is mathematically correct.
        
        Args:
            problem: Original mathematical expression
            student_step: Student's attempted transformation
        
        Returns:
            dict with keys:
                - correct (bool): Whether the step is mathematically valid
                - feedback (str): Explanatory feedback for the student
        
        Raises:
            ParseError: If expressions cannot be parsed
            
        Examples:
            >>> validator = MathValidator()
            >>> validator.validate_step("x + 2", "2 + x")
            {'correct': True, 'feedback': 'Correct! Your step is mathematically valid.'}
            
            >>> validator.validate_step("x + 2", "x + 3")
            {'correct': False, 'feedback': 'Not quite. Your expression differs...'}
        """
        try:
            problem_expr = self._parse_expression(problem)
            step_expr = self._parse_expression(student_step)
            
            # Check if expressions are equivalent
            correct = self._are_equivalent(problem_expr, step_expr)
            
            # Generate feedback
            feedback = self._generate_feedback(problem_expr, step_expr, correct)
            
            return {
                "correct": correct,
                "feedback": feedback
            }
        
        except SympifyError as e:
            raise ParseError(f"Cannot parse expression: {str(e)}")
        except Exception as e:
            raise ParseError(f"Error validating expression: {str(e)}")
    
    def _parse_expression(self, expr_str: str) -> Expr:
        """
        Parse string to SymPy expression.
        Supports equations like 'x + 2 = 5' by converting to 'x + 2 - 5'.
        """
        expr_str = expr_str.strip()

        # Replace ^ with ** for safety (students may type x^2)
        expr_str = expr_str.replace("^", "**")

        # Handle equations
        if "=" in expr_str:
            left, right = expr_str.split("=")
            expr_str = f"({left}) - ({right})"

        return sympify(expr_str)
        
    def _are_equivalent(self, expr1: Expr, expr2: Expr) -> bool:
        """
        Check if two expressions are mathematically equivalent.
        
        Args:
            expr1: First SymPy expression
            expr2: Second SymPy expression
        
        Returns:
            bool: True if expressions are equivalent, False otherwise
        """
        # Simplify the difference between expressions
        # If the difference simplifies to 0, they are equivalent
        difference = simplify(expr1 - expr2)
        return difference == 0
    
    def _generate_feedback(self, problem: Expr, step: Expr, correct: bool) -> str:
        """
        Generate explanatory feedback for the student.
        
        Args:
            problem: Original problem expression
            step: Student's step expression
            correct: Whether the step is correct
        
        Returns:
            str: Feedback message for the student
        """
        if correct:
            return "Correct! Your step is mathematically valid."
        else:
            return (
                "Not quite. Your expression differs from the original. "
                "Check your algebra and make sure each transformation is valid."
            )
