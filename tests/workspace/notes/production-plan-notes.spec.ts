import { expect, test } from "../../../../../src/core/fixtures";
import { createNewNote, getTagExcept } from "../../../../../test-data/data-creation-utils";
import { Note, Production } from "../../../../../test-data/types";


test.describe.serial("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@workspace", "@notes"] }, () => {
 


    // @feature notes
    test("TC-1: Able to add a note to the Production Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@notes"] },
        async ({ planningApp }) => {
        
            const isNotePresent = await planningApp.notePanel.isNotePresent(note);
            expect(isNotePresent, "New note should be added a Production plan.").toBeTruthy();
        });
    
    // @feature notes
    test("TC-2: Able to edit recently added note of the Production Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@notes"] },
        async ({ planningApp }) => {
             const isNotePresent = await planningApp.notePanel.isNotePresent(editNote);
            expect(isNotePresent, "Edited Production plan note should be displayed in person notes section.").toBeTruthy();
        });

    // @feature notes
        test("TC-3: Able to delete note of the Production Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@notes"] },
            async ({ planningApp }) => {
                 const isNotePresent = await planningApp.notePanel.isNotePresent(editNote);
                expect(isNotePresent, "Deleted note should NOT be displayed in Production plan note section.").toBeFalsy();
        });
});

