// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{advance, first_failure, tally, Transfer};

#[test]
fn saturation_never_wraps() {
    // 250 + 200 in a u8 would wrap to 194; saturating arithmetic finishes
    // the transfer instead.
    assert_eq!(
        advance(Transfer::Running { percent: 95 }, 200),
        Transfer::Done { bytes: 0 }
    );
}

#[test]
fn a_huge_first_step_still_leaves_room_to_finish() {
    // Queued caps at 99, not 100: Running is a state that has not finished,
    // and a Running{percent: 100} would be a contradiction on screen.
    match advance(Transfer::Queued, 200) {
        Transfer::Running { percent } => assert_eq!(percent, 99),
        other => panic!("expected Running, got {other:?}"),
    }
}

#[test]
fn finished_states_pass_through() {
    assert_eq!(
        advance(Transfer::Done { bytes: 7 }, 50),
        Transfer::Done { bytes: 7 }
    );
    assert_eq!(
        advance(Transfer::Failed { reason: "x".to_string() }, 50),
        Transfer::Failed { reason: "x".to_string() }
    );
}

#[test]
fn first_failure_borrows_the_reason() {
    let transfers = vec![
        Transfer::Queued,
        Transfer::Failed { reason: "first".to_string() },
        Transfer::Failed { reason: "second".to_string() },
    ];
    // The Option<&str> ties to the slice — no allocation, and the value
    // is provably the one inside the vec.
    assert_eq!(first_failure(&transfers), Some("first"));
}

#[test]
fn no_failures_is_none() {
    assert_eq!(first_failure(&[Transfer::Queued]), None);
    assert_eq!(first_failure(&[]), None);
}

#[test]
fn an_empty_tally_is_zeros() {
    assert_eq!(tally(&[]), (0, 0, 0, 0));
}
