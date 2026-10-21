#[test_only]
module inkblob::reliability_tests {
    use std::string;
    use std::option;
    use sui::test_scenario;
    use inkblob::test_utils;
    use inkblob::notebook::{Self, update_note, create_test_id_from_address};

    // Two writers read the same version. Writer A commits, then writer B submits
    // the old version in another transaction within the same epoch.
    #[test]
    #[expected_failure(abort_code = inkblob::notebook::E_VERSION_MISMATCH)]
    public fun stale_writer_is_rejected_within_same_epoch() {
        let owner = test_utils::owner();
        let mut scenario = test_utils::create_scenario(owner);
        let (mut notebook, mut reserve) = test_utils::create_test_notebook_with_reserve(&mut scenario, b"Stage probe");
        let note_id = create_test_id_from_address(owner, test_scenario::ctx(&mut scenario));
        update_note(&mut notebook, &mut reserve, note_id,
            string::utf8(b"original"), string::utf8(b"object0"), string::utf8(b"title"),
            option::none(), option::none(), option::none(), option::none(), option::none(),
            test_scenario::ctx(&mut scenario));
        let version_both_writers_read = notebook::note_revision(notebook::borrow_note(notebook::get_notebook_notes(&notebook), note_id));

        test_scenario::next_tx(&mut scenario, owner);
        update_note(&mut notebook, &mut reserve, note_id,
            string::utf8(b"writer_a"), string::utf8(b"objectA"), string::utf8(b"title"),
            option::none(), option::none(), option::some(version_both_writers_read), option::none(), option::none(),
            test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, owner);
        update_note(&mut notebook, &mut reserve, note_id,
            string::utf8(b"writer_b_overwrites_a"), string::utf8(b"objectB"), string::utf8(b"title"),
            option::none(), option::none(), option::some(version_both_writers_read), option::none(), option::none(),
            test_scenario::ctx(&mut scenario));

        let note = notebook::borrow_note(notebook::get_notebook_notes(&notebook), note_id);
        assert!(notebook::note_revision(note) == version_both_writers_read, 100);
        assert!(notebook::get_note_blob_id(note) == &string::utf8(b"writer_b_overwrites_a"), 101);
        test_scenario::return_shared(notebook);
        test_scenario::return_shared(reserve);
        test_scenario::end(scenario);
    }

    #[test]
    public fun owner_revokes_without_holding_grantee_receipt() {
        let mut scenario = test_utils::create_scenario(test_utils::owner());
        let mut notebook = test_utils::create_test_notebook(&mut scenario, b"Revocation");
        notebook::grant_access(&mut notebook, test_utils::device_1(), 1, option::none(), vector[1, 2, 3], test_scenario::ctx(&mut scenario));
        notebook::revoke_access_by_address(&mut notebook, test_utils::device_1(), test_scenario::ctx(&mut scenario));
        assert!(!notebook::has_write_access(&notebook, test_utils::device_1(), test_scenario::ctx(&mut scenario)), 0);
        assert!(option::is_none(&notebook::get_wrapped_content_key(&notebook, test_utils::device_1())), 1);
        test_scenario::return_shared(notebook);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = inkblob::notebook::E_NOT_OWNER)]
    public fun grantee_cannot_use_owner_revocation_entry() {
        let mut scenario = test_utils::create_scenario(test_utils::owner());
        let mut notebook = test_utils::create_test_notebook(&mut scenario, b"Revocation");
        notebook::grant_access(&mut notebook, test_utils::device_1(), 1, option::none(), vector[], test_scenario::ctx(&mut scenario));
        test_scenario::next_tx(&mut scenario, test_utils::device_1());
        notebook::revoke_access_by_address(&mut notebook, test_utils::owner(), test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(notebook);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = inkblob::notebook::E_SESSION_EXPIRED)]
    public fun revoked_hot_wallet_cannot_write() {
        let owner = test_utils::owner();
        let mut scenario = test_utils::create_scenario(owner);
        let (mut notebook, mut reserve) = test_utils::create_test_notebook_with_reserve(&mut scenario, b"Session revocation");
        let (mut sui_coin, mut wal_coin) = test_utils::create_test_coins(&mut scenario, 1000000000, 2000000000);
        notebook::authorize_session_and_fund(&notebook, &mut sui_coin, &mut wal_coin,
            string::utf8(b"device"), test_utils::device_1(), test_utils::future(), option::none(), option::none(), test_scenario::ctx(&mut scenario));
        test_scenario::next_tx(&mut scenario, test_utils::device_1());
        let cap = test_scenario::take_from_sender<notebook::SessionCap>(&scenario);
        let cap_id = sui::object::id(&cap);
        test_scenario::return_to_sender(&scenario, cap);
        test_scenario::next_tx(&mut scenario, owner);
        notebook::revoke_session_by_id(&mut notebook, cap_id, test_scenario::ctx(&mut scenario));
        test_scenario::next_tx(&mut scenario, test_utils::device_1());
        let cap = test_scenario::take_from_sender<notebook::SessionCap>(&scenario);
        let note_id = create_test_id_from_address(owner, test_scenario::ctx(&mut scenario));
        notebook::update_note_with_session(&mut notebook, &mut reserve, cap, note_id,
            string::utf8(b"blob"), string::utf8(b"object"), string::utf8(b"title"),
            option::none(), option::none(), option::none(), option::none(), option::none(), test_scenario::ctx(&mut scenario));
        sui::transfer::public_transfer(sui_coin, owner);
        sui::transfer::public_transfer(wal_coin, owner);
        test_scenario::return_shared(notebook);
        test_scenario::return_shared(reserve);
        test_scenario::end(scenario);
    }
}
