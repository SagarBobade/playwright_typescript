import { expect, test } from "../../../../../src/core/fixtures";
import { createNewNote, getTagExcept } from "../../../../../test-data/data-creation-utils";
import { Note, Production } from "../../../../../test-data/types";


test.describe.serial("ProductionPlanning: Status Note", { tag: ["@planningApp", "@sanity", "@workspace", "@notes", "@statusNote"] }, () => {
   

    // @feature notes
    test("TC-1: Able to create a status note to a Production.", { tag: ["@planningApp", "@sanity", "@workspace", "@notes", "@statusNote"] },
        async ({ planningApp, users }) => {
             const isNotePresent = await planningApp.notePanel.isStatusNotePresent(note);
            expect(isNotePresent, "Status Note should be added a Production plan.").toBeTruthy();
            
            const createdBy = await planningApp.notePanel.getStatusNoteCreatedBy(note);
            expect(createdBy, "Status note should show correct created by user.").toEqual(users.ProductionPlanner.name);
            await planningApp.navigation.logout();
        });

    // @feature notes
    test("TC-2: Able to edit recently added status note by another person.", { tag: ["@planningApp", "@sanity", "@workspace", "@notes", "@statusNote"] },
        async ({ planningApp, users }) => {
          const isNotePresent = await planningApp.notePanel.isStatusNotePresent(editNote);
            expect(isNotePresent, "Edited status note should be displayed in Production plan note section.").toBeTruthy();

            const createdBy = await planningApp.notePanel.getStatusNoteCreatedBy(editNote);
            expect(createdBy, "Status note should show correct updated by user.").toEqual(users.ProductionPlanner2.name);
            await planningApp.navigation.logout();
        });

    // @feature notes
        test("TC-3: Able to mark existing note as status note.", { tag: ["@planningApp", "@sanity", "@workspace", "@notes", "@statusNote"] },
        async ({ planningApp, users }) => {
            const isUserLoggedIn = await planningApp.homepage.isUserLoggedIn();
            expect(isUserLoggedIn, "Planner User should be able to login successfully.").toBeTruthy();

              const isNotePresent = await planningApp.notePanel.isStatusNotePresent(note2);

            expect(isNotePresent, "Status Note should be updated with an existing note.").toBeTruthy();
        });

        // @feature notes
        test("TC-4: Able to delete the status note.", { tag: ["@planningApp", "@sanity", "@workspace", "@notes", "@statusNote"] },
            async ({ planningApp }) => {
            
                const isNotePresent = await planningApp.notePanel.isStatusNotePresent(note2);
                expect(isNotePresent, "Deleted status note should NOT be displayed.").toBeFalsy();
        });
});