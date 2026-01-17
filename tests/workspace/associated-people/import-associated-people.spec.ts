import { getIndexOfRecordInMap } from "../../../../../src/core/common-actions";
import { expect, test } from "../../../../../src/core/fixtures";
import { createCSVwithProductionAssociatedPeopleList, createMultipleProductionAssociatedPeopleList } from "../../../../../test-data/data-creation-utils";
import { Contact, Production, ProductionAssociatedPeopleImportRecord } from "../../../../../test-data/types";

    

test.describe.serial("Import Associated people", { tag: ["@planningApp", "@sanity", "@workspace", "@plan",  "@associatedPeople"] }, () => {



    // @feature associated-people
    test("TC:1 - Should be able to import associated people from a CSV file", { tag: ["@planningApp", "@sanity", "@workspace", "@plan",  "@associatedPeople"] }, 
        async ({ planningApp }) => {
       
            if (record > -1) {
                expect.soft(requiredRecord.get("First name") , "Expected Associated person first name is => " + productionAssociatedPeopleList[j].firstName).toEqual(productionAssociatedPeopleList[j].firstName);
                expect.soft(requiredRecord.get("Last name") ,requiredRecord.get("First name") + "Expected Associated person last name is => " + productionAssociatedPeopleList[j].lastName).toEqual(productionAssociatedPeopleList[j].lastName);
                expect.soft(requiredRecord.get("Email") ,requiredRecord.get("First name") + "Expected Associated person email is => " + productionAssociatedPeopleList[j].email).toEqual(productionAssociatedPeopleList[j].email);
                expect.soft(requiredRecord.get("Phone") , requiredRecord.get("First name") + "Expected Associated person phone is => " + productionAssociatedPeopleList[j].phone).toEqual(productionAssociatedPeopleList[j].phone);
                expect.soft(requiredRecord.get("Title") , requiredRecord.get("First name") + "Expected Associated person title is => " + productionAssociatedPeopleList[j].title).toEqual(productionAssociatedPeopleList[j].title);
                expect.soft(requiredRecord.get("Department") , requiredRecord.get("First name") + "Expected Associated person department is => " + productionAssociatedPeopleList[j].department).toEqual(productionAssociatedPeopleList[j].department);
                expect.soft(requiredRecord.get("Production Department") , requiredRecord.get("First name") + "Expected Associated person production department is => " + productionAssociatedPeopleList[j].productionDepartment).toEqual(productionAssociatedPeopleList[j].productionDepartment);
                expect.soft(requiredRecord.get("Production Roles") , requiredRecord.get("First name") + " Expected Production role is => " + productionAssociatedPeopleList[j].productionRole).toEqual(productionAssociatedPeopleList[j].productionRole);
                expect.soft(requiredRecord.get("Professional Roles") , requiredRecord.get("First name") + " Expected Associated person Role is => " + productionAssociatedPeopleList[j].professionalRole).toEqual(productionAssociatedPeopleList[j].professionalRole);
                expect.soft(requiredRecord.get("Organization") , requiredRecord.get("First name") + " Expected Associated person Organization is => " + productionAssociatedPeopleList[j].organization).toEqual(productionAssociatedPeopleList[j].organization);
            } else {
                expect.soft(record, 'Associated Person ' + productionAssociatedPeopleList[j].firstName + ' not found in grid data').toBeGreaterThanOrEqual(0);
                }
            }
    });


});