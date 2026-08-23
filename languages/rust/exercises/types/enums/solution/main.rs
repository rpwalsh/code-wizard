// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
//! A transfer's lifecycle as a sum type: the illegal states do not compile.

/// The states a transfer can be in. Each carries exactly what it knows.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Transfer {
    Queued,
    Running { percent: u8 },
    Done { bytes: u64 },
    Failed { reason: String },
}

pub fn describe(transfer: &Transfer) -> String {
    // No `_` arm: adding a variant breaks this build, which is the
    // type checker writing tomorrow's to-do list.
    match transfer {
        Transfer::Queued => "queued".to_string(),
        Transfer::Running { percent } => format!("running ({percent}%)"),
        Transfer::Done { bytes } => format!("done ({bytes} bytes)"),
        Transfer::Failed { reason } => format!("failed: {reason}"),
    }
}

pub fn advance(transfer: Transfer, step: u8) -> Transfer {
    match transfer {
        Transfer::Queued => Transfer::Running {
            percent: 0u8.saturating_add(step).min(99),
        },
        Transfer::Running { percent } => {
            // Saturating: a percentage wants arithmetic that stops at the
            // top, not u8 wrap-around at 255.
            let next = percent.saturating_add(step);
            if next >= 100 {
                Transfer::Done { bytes: 0 }
            } else {
                Transfer::Running { percent: next }
            }
        }
        // Moves in, moves out: passing through unchanged is free.
        finished @ (Transfer::Done { .. } | Transfer::Failed { .. }) => finished,
    }
}

pub fn first_failure(transfers: &[Transfer]) -> Option<&str> {
    // &str borrowed from inside the slice: the signature itself proves
    // no allocation happened. The reflexive .clone() would compile too —
    // and cost an allocation per call for nothing.
    transfers.iter().find_map(|transfer| match transfer {
        Transfer::Failed { reason } => Some(reason.as_str()),
        _ => None,
    })
}

pub fn tally(transfers: &[Transfer]) -> (usize, usize, usize, usize) {
    let mut counts = (0, 0, 0, 0);
    for transfer in transfers {
        match transfer {
            Transfer::Queued => counts.0 += 1,
            Transfer::Running { .. } => counts.1 += 1,
            Transfer::Done { .. } => counts.2 += 1,
            Transfer::Failed { .. } => counts.3 += 1,
        }
    }
    counts
}
