package RCX::API::Mm;

# Module: RCX::API::Mm
# Author: hookbot@r.cx
# Purpose: Define mm_* API methods
# Mm = (Master Mind)

use strict;
use warnings;
use Socket qw(inet_ntoa);
use base qw(RCX::API);
use Throw qw(throw);

sub start__meta {
    return {
        desc => 'Begin a Game',
        args => {},
    };
}

sub start {
    my $self = shift;
    my $args = shift;
    $self->validate_args($args);
    my @r = ("a".."z", "A".."Z");
    my $r = "";
    $r .= $r[rand @r] for (1..16);
    if ($self->dbh->do(q{
        INSERT INTO mm_game (session, creation, last_used)
        VALUES (?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
    }, {}, $r)) {
        $self->dbh->do(q{
            DELETE FROM mm_game
             WHERE last_used < UNIX_TIMESTAMP() - 86400*14
        });
        return {
            session => $r,
        };
    }
    throw "Failed to create session";
}

sub gen__meta {
    return {
        desc => 'Choose random pegs for the game',
        args => {
            session => {
                desc => 'Session ID',
                required => 1,
                required_error => 'session required',
                min_length => 16,
                max_length => 16,
            },
            colors => {
                desc => 'Number of different colors to choose from',
                required => 1,
                required_error => 'colors required',
                type => 'INT',
                min => 2,
                max => 26,
            },
            pegs => {
                desc => 'Total Number of Pegs',
                required => 1,
                required_error => 'pegs required',
                type => 'INT',
                min => 2,
                max => 64,
            },
            dups => {
                desc => 'Whether duplicate pegs are allowed',
                required => 1,
                required_error => 'dups required',
                type => 'BOOL',
            },
        },
    };
}

sub gen {
    my $self = shift;
    my $args = shift;
    $self->validate_args($args);
    my $session = $args->{session};
    my $colors = $args->{colors};
    my $pegs = $args->{pegs};
    my $dups = $args->{dups};
    if (!$dups and $colors < $pegs) {
        throw "Impossible to generate a board with more Pegs than Colors without Duplicates allowed", {
            colors => $colors,
            pegs => $pegs,
        };
    }
    my $letter = "A";
    my @r = ();
    for (1..$colors) {
        push @r, $letter++;
    }
    my $rand = "";
    for (1..$pegs) {
        if ($dups) {
            $rand .= $r[rand @r];
        }
        else {
            $rand .= [splice @r, rand(@r), 1]->[0];
        }
    }
    if (!$self->dbh->do(q{
        UPDATE mm_game
           SET board = ?, last_used = UNIX_TIMESTAMP()
         WHERE session = ?
    }, {}, $rand, $session)) {
        throw "Failed to think of a valid board", {
            why => "CRASH: ".DBI->errstr(),
        };
    }
    return {
        success => "Board Generated. Good luck!",
        colors => $colors,
        pegs => $pegs,
        dups => $dups,
    };
}

sub judge__meta {
    return {
        desc => 'Choose random pegs for the game',
        args => {
            session => {
                desc => 'Session ID',
                required => 1,
                required_error => 'session required',
                min_length => 16,
                max_length => 16,
            },
            board => {
                desc => 'Guess board',
                required => 1,
                required_error => 'Board must be provided to judge',
            },
        },
    };
}

sub judge {
    my $self = shift;
    my $args = shift;
    $self->validate_args($args);
    my $session = $args->{session};
    my $judge = $args->{board};
    my ($id, $board) = $self->dbh->selectrow_array(q{
        SELECT id, board
          FROM mm_game
         WHERE session = ?
    }, {}, $session);
    throw "Invalid session", {
        session => $session,
    } if !$id;
    throw "You must first use mm_gen method to generate a board", {
        session => $session,
    } if !$board;
    if (length($judge) < length($board)) {
        throw "Guess too short", {
            guess_length => length($judge),
            board_length => length($board),
        };
    }
    if (length($judge) > length($board)) {
        throw "Guess too long", {
            guess_length => length($judge),
            board_length => length($board),
        };
    }
    if (!$self->dbh->do(q{
        UPDATE mm_game
           SET last_used = UNIX_TIMESTAMP()
         WHERE id = ?
    }, {}, $id)) {
        throw "Failed to freshen session", { id => $id, session => $session, db_err => DBI->errstr() };
    }
    my $blacks = 0;
    my $pegs = length($judge);
    my $i = $pegs;
    while ($i--) {
        if (substr($judge, $i, 1) eq substr($board, $i, 1)) {
            $blacks++;
            substr($judge, $i, 1, "");
            substr($board, $i, 1, "");
        }
    }
    my $whites = 0;
    $i = length($judge);
    while ($i--) {
        my $needle = chop $judge;
        my $found = index($board, $needle);
        if ($found >= 0) {
            $whites++;
            substr($board, $found, 1, "");
        }
    }
    if ($blacks == $pegs && $whites == 0) {
        return {
            success => 1,
            message => "Congratulations! Exact Match!",
            blacks => $pegs,
            whites => 0,
        };
    }
    else {
        return {
            success => 0,
            message => "Judge completed. Try again.",
            blacks => $blacks,
            whites => $whites,
        };
    }
}

1;