from app.algorithms.tsp_branch_bound import solve_tsp_branch_bound


def test_branch_and_bound_finds_optimal_closed_tour_for_asymmetric_matrix():
    distances = [
        [0, 10, 15, 20],
        [5, 0, 9, 10],
        [6, 13, 0, 12],
        [8, 8, 9, 0],
    ]

    result = solve_tsp_branch_bound(distances)

    assert result.order == [0, 1, 3, 2, 0]
    assert result.total_distance == 35
    assert result.branches_explored > 0
    assert result.branches_pruned > 0


def test_branch_and_bound_handles_single_stop_closed_tour():
    distances = [
        [0, 900],
        [1100, 0],
    ]

    result = solve_tsp_branch_bound(distances)

    assert result.order == [0, 1, 0]
    assert result.total_distance == 2000
    assert result.branches_explored == 1
    assert result.branches_pruned == 0


def test_branch_and_bound_rejects_empty_matrix():
    try:
        solve_tsp_branch_bound([])
    except ValueError as error:
        assert str(error) == "distance matrix must not be empty"
    else:
        raise AssertionError("Expected ValueError")


def test_branch_and_bound_rejects_non_square_matrix():
    try:
        solve_tsp_branch_bound([[0, 1], [1]])
    except ValueError as error:
        assert str(error) == "distance matrix must be square"
    else:
        raise AssertionError("Expected ValueError")
