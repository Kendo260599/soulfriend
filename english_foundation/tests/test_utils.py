"""Tests for shared utility functions."""
from english_foundation.core.utils import difficulty_from_level, slice_wrap


class TestDifficultyFromLevel:
    def test_low_level(self):
        assert difficulty_from_level(0.0) == 1
        assert difficulty_from_level(0.34) == 1

    def test_mid_level(self):
        assert difficulty_from_level(0.35) == 2
        assert difficulty_from_level(0.69) == 2

    def test_high_level(self):
        assert difficulty_from_level(0.7) == 3
        assert difficulty_from_level(1.0) == 3

    def test_boundary(self):
        assert difficulty_from_level(0.35) == 2
        assert difficulty_from_level(0.7) == 3


class TestSliceWrap:
    def test_basic(self):
        assert slice_wrap([1, 2, 3, 4, 5], 0, 3) == [1, 2, 3]

    def test_wraps_around(self):
        assert slice_wrap([1, 2, 3], 2, 3) == [3, 1, 2]

    def test_empty_list(self):
        assert slice_wrap([], 0, 5) == []

    def test_zero_size(self):
        assert slice_wrap([1, 2, 3], 0, 0) == []

    def test_negative_size(self):
        assert slice_wrap([1, 2, 3], 0, -1) == []

    def test_single_item(self):
        assert slice_wrap([42], 0, 3) == [42, 42, 42]
