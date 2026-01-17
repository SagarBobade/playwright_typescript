import { expect, test } from "../../../../src/core/fixtures";
import { createCSVwithProductionList } from "../../../../test-data/data-creation-utils";
import { ProductionImportRecord } from "../../../../test-data/types";
import { getIndexOfRecordInMap } from "../../../../src/core/common-actions";



// @feature production-plan
test("TC:1 - Should be able to import 2 Productions in the Workspace", { tag: ["@test", "@planningApp", "@sanity", "@workspace", "@plan"] },
        async ({ planningApp }) => {
       
        for (let i = 0; i < expectedProductionList.length; i++) {
            await planningApp.productionPlanningListPage.changeViewToTable();
            title = expectedProductionList[i].title;
            
            const results = await planningApp.productionPlanningListPage.quickSearchProduction(title);
            await planningApp.productionPlanningListPage.changeViewToList();
            
            const statusNote = await planningApp.productionPlanningListPage.getStatusNote(title);
            await planningApp.productionPlanningListPage.changeViewToTable();

            const isProductionTitlePresent = results.some(text => text.includes(title));
            expect(isProductionTitlePresent, "Production should be searched").toBeTruthy();

            await planningApp.productionPlanningListPage.openProductionByTitle(title);
            const importedProduction = await planningApp.productionPlanningHeader.getProductionDetails();
            importedProduction.statusNote = statusNote;

            const expected = expectedProductionList[i];
            expect(importedProduction.title, 'Title matches').toEqual(expected.title);
            expect(importedProduction.aka, 'AKA matches').toEqual(expected.aka);
            expect(importedProduction.productionType, 'Production type matches').toEqual(expected.productionType);
            expect(importedProduction.subType, 'Sub Type matches').toEqual(expected.subType);
            expect(importedProduction.genre[0], 'Genre matches').toEqual(expected.genre[0]);
            expect(importedProduction.summary, 'Summary matches').toEqual(expected.summary);
            expect(importedProduction.productionStatus, 'Production status matches').toEqual(expected.productionStatus);
            expect(importedProduction.projectStatus, 'Project status matches').toEqual(expected.projectStatus);
            expect(importedProduction.projectOwner, 'Project owner matches').toEqual(expected.projectOwner.split(',').slice(0, 2).map(s => s.trim()).join(' '));
            expect(importedProduction.statusNote, 'Status note matches').toEqual(expected.statusNote);
            expect(importedProduction.runtime, 'Runtime matches').toEqual(expected.runtime);
            expect(importedProduction.productionYears, 'Production years matches').toEqual(expected.productionYears);
            expect(importedProduction.releaseDate, 'Release date matches').toBe(expected.releaseDate);

            if(importedProduction.seasonNumber !== undefined){
                expect(importedProduction.seasonNumber, 'Season number matches').toEqual(expected.seasonNumber);
            }
            if(importedProduction.numberOfEpisodes !== undefined){
                expect(importedProduction.numberOfEpisodes, 'Number of episodes matches').toEqual(expected.numberOfEpisodes);
            }
            if(importedProduction.episodeNumber !== undefined){
                expect(importedProduction.episodeNumber, 'Episode number matches').toEqual(expected.episodeNumber);
            }
           
                await planningApp.productionAssociatedPeopleListPage.navigateToAssociatedPeopleTabInProductionPlan();
                const gridData = await planningApp.productionResourceListPage.getTableData();
        
                    const personData = expected.associatedPeople.split('\n')[0].split(',').map(s => s.trim());
                    for (let j = 0; j < 2; j++) {
                        const record = await getIndexOfRecordInMap(personData[0], gridData);
                        const requiredRecord = gridData[record];
                        if (record > -1) {
                        expect.soft(requiredRecord.get("First name") , "Expected Associated person first name is => " + personData[0]).toEqual(personData[0]);
                        expect.soft(requiredRecord.get("Last name") , "Expected Associated person last name is => " + personData[1]).toEqual(personData[1]);
                        expect.soft(requiredRecord.get("Production Roles") , requiredRecord.get("First name") + " Expected Production role is => " + personData[2]).toEqual(personData[2]);
                        expect.soft(requiredRecord.get("Professional Roles") , requiredRecord.get("First name") + " Expected Associated person Role is => " + personData[3]).toEqual(personData[3]);
                        expect.soft(requiredRecord.get("Organization") , requiredRecord.get("First name") + " Expected Associated person Organization is => " + personData[4]).toEqual(personData[4]);
                        } else {
                            expect.soft(record, 'Associated Person not found in grid data').toBeGreaterThanOrEqual(0);
                        }
                    }

                    await planningApp.productionAssociatedOrganizationListPage.navigateToAssociatedOrganizationTabInProductionPlan();
                    const orgGridData = await planningApp.productionResourceListPage.getTableData();
            
                    const orgData = expected.associatedOrganizations.split('\n')[0].split(',').map(s => s.trim());
                    const record = await getIndexOfRecordInMap(orgData[0], orgGridData);
                    const requiredRecord = orgGridData[record];
                    if (record > -1) {
                        expect.soft(requiredRecord.get("Name") , "Expected Associated organization name is => " + orgData[0]).toEqual(orgData[0]);
                        expect.soft(requiredRecord.get("Role(s)") , "Expected Associated organization type is => " + orgData[1]).toEqual(orgData[1]);
                    } else {
                        expect.soft(record, 'Associated Organization not found in grid data').toBeGreaterThanOrEqual(0);
                }
                        
        }

});
