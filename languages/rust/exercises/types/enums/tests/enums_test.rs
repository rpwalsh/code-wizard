// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
#[path = "../main.rs"]
mod exercise;

use exercise::{advance, describe, tally, Transfer};

#[test]
fn each_state_describes_itself() {
    assert_eq!(describe(&Transfer::Queued), "queued");
    assert_eq!(describe(&Transfer::Running { percent: 42 }), "running (42%)");
    assert_eq!(describe(&Transfer::Done { bytes: 1024 }), "done (1024 bytes)");
    assert_eq!(
        describe(&Transfer::Failed { reason: "timeout".to_string() }),
        "failed: timeout"
    );
}

#[test]
fn queued_starts_running() {
    assert_eq!(
        advance(Transfer::Queued, 10),
        Transfer::Running { percent: 10 }
    );
}

#[test]
fn running_accumulates() {
    let mid = advance(Transfer::Running { percent: 40 }, 25);
    assert_eq!(mid, Transfer::Running { percent: 65 });
}

#[test]
fn reaching_one_hundred_finishes() {
    assert_eq!(
        advance(Transfer::Running { percent: 90 }, 10),
        Transfer::Done { bytes: 0 }
    );
}

#[test]
fn tally_counts_by_state() {
    let transfers = vec![
        Transfer::Queued,
        Transfer::Running { percent: 5 },
        Transfer::Done { bytes: 9 },
        Transfer::Queued,
        Transfer::Failed { reason: "dns".to_string() },
    ];
    assert_eq!(tally(&transfers), (2, 1, 1, 1));
}
