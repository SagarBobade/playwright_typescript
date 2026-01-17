import { expect, test } from "../../../../../../src/core/fixtures";
import { Note, Production, ProductionResource } from "../../../../../../test-data/types";
import { createNewNote, createNewProductionResource, getTagExcept } from "../../../../../../test-data/data-creation-utils";


test.describe.serial("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@resource", "@notes"] }, () => {
  


    // @feature notes
    test("TC-1: Able to add a note to the Resource.", { tag: ["@planningApp", "@sanity", "@resource", "@notes"] },
        async ({ planningApp }) => {
         
            const isNotePresent = await planningApp.notePanel.isNotePresent(note);
            expect(isNotePresent, "New note should be added to a resource.").toBeTruthy();
        });

    // @feature notes
    test("TC-2: Able to edit recently added note of the Resource.", { tag: ["@planningApp", "@sanity", "@resource", "@notes"] },
        async ({ planningApp }) => {
        
            const isNotePresent = await planningApp.notePanel.isNotePresent(editNote);
            expect(isNotePresent, "Resource note should be edited.").toBeTruthy();
        });

        // @feature notes
        test("TC-3: Able to delete note of the Resource.", { tag: ["@planningApp", "@sanity", "@resource", "@notes"] },
            async ({ planningApp }) => {
            
                const isNotePresent = await planningApp.notePanel.isNotePresent(editNote);
                expect(isNotePresent, "Deleted note should NOT be displayed in resource note section.").toBeFalsy();
        });

    // @feature notes
    test("TC-4: Able to add default note to the Resource.", { tag: ["@planningApp", "@sanity", "@resource", "@notes"] },
        async ({ planningApp }) => {
         
            const isNotePresent = await planningApp.detailResourcePage.isDefaultNotePresent(defaultNote.body);
            expect(isNotePresent, "Default Resource note should be created.").toBeTruthy();
        });

    // @feature notes
    test("TC-5: Able to edit default note of the Resource.", { tag: ["@planningApp", "@sanity", "@resource", "@notes"] },
        async ({ planningApp }) => {
       
            const isNotePresent = await planningApp.detailResourcePage.isDefaultNotePresent(editdefaultNote.body);
            expect(isNotePresent, "Default Resource note should be edited.").toBeTruthy();
        });
});

