import { expect, test } from "../../../../../src/core/fixtures";
import { createPerson } from "../../../../../test-data/data-creation-utils";
import { Contact, Production } from "../../../../../test-data/types";
import { getIndexOfRecordInMap } from "../../../../../src/core/common-actions";



// TODO: here we must select contact of type "Account"
test.describe.skip("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedPeople"] }, () => {
   
    // @feature associated-people
    test("TC-1: Able to add two associated people to a Production plan", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedPeople"] },
        async ({ planningApp }) => {
          
            for (let i = 0; i < 2; i++) {
                const record = await getIndexOfRecordInMap(person[i], gridData);
                const requiredRecord = gridData[record];

                if (record > -1) {
                    expect.soft(requiredRecord.get("First name") + " " + requiredRecord.get("Last name"), "Expected Associated person name is => " + person[i].basicInformation.name).toEqual(person[i].basicInformation.name);
                    expect.soft(requiredRecord.get("Email") , requiredRecord.get("First name") + " Expected Associated person email is => " + person[i].basicInformation.email).toEqual(person[i].basicInformation.email);
                    expect.soft(requiredRecord.get("Organization") , requiredRecord.get("First name") + " Expected Associated person Organization is => " + person[i].experience.professionalExperience[0].organization).toEqual(person[i].experience.professionalExperience[0].organization);
                    expect.soft(requiredRecord.get("Title") , requiredRecord.get("First name") + " Expected Associated person Title is => " + person[i].experience.professionalExperience[0].title).toEqual(person[i].experience.professionalExperience[0].title);
                    expect.soft(requiredRecord.get("Department") , requiredRecord.get("First name") + " Expected Associated person Department is => " + person[i].experience.professionalExperience[0].department).toEqual(person[i].experience.professionalExperience[0].department);
                    expect.soft(requiredRecord.get("Professional Role") , requiredRecord.get("First name") + " Expected Associated person Role is => " + person[i].experience.professionalExperience[0].roles[0]).toEqual(person[i].experience.professionalExperience[0].roles[0]);
                    expect.soft(requiredRecord.get("Production Role") , requiredRecord.get("First name") + " Expected Associated person Production Role is => " + person[i].experience.creativeExperience[0].productionRole[0]).toEqual(person[i].experience.creativeExperience[0].productionRole[0]);
                    expect.soft(requiredRecord.get("Production Department") , requiredRecord.get("First name") + " Expected Associated person Production Department is => " + person[i].experience.creativeExperience[0].department).toEqual(person[i].experience.creativeExperience[0].department);
                } else {
                    expect.soft(1, "Associated Person creation Failed").toEqual(2);
                }
            }
        })

    // @feature associated-people
    test("TC-2: Able to change associated people of the Production plan", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedPeople"] },
        async ({ planningApp }) => {
           
            if (record > -1) {
                expect.soft(requiredRecord.get("First name") + " " + requiredRecord.get("Last name"), "Expected Associated person name is => " + editPerson.basicInformation.name).toEqual(editPerson.basicInformation.name);
                expect.soft(requiredRecord.get("Email") , requiredRecord.get("First name") + " Expected Associated person email is => " + editPerson.basicInformation.email).toEqual(editPerson.basicInformation.email);
                expect.soft(requiredRecord.get("Organization") , requiredRecord.get("First name") + " Expected Associated person Organization is => " + editPerson.experience.professionalExperience[0].organization).toEqual(editPerson.experience.professionalExperience[0].organization);
                expect.soft(requiredRecord.get("Title") , requiredRecord.get("First name") + " Expected Associated person Title is => " + editPerson.experience.professionalExperience[0].title).toEqual(editPerson.experience.professionalExperience[0].title);
                expect.soft(requiredRecord.get("Department") , requiredRecord.get("First name") + " Expected Associated person Department is => " + editPerson.experience.professionalExperience[0].department).toEqual(editPerson.experience.professionalExperience[0].department);
                expect.soft(requiredRecord.get("Professional Role") , requiredRecord.get("First name") + " Expected Associated person Role is => " + editPerson.experience.professionalExperience[0].roles[0]).toEqual(editPerson.experience.professionalExperience[0].roles[0]);
                expect.soft(requiredRecord.get("Production Role") , requiredRecord.get("First name") + " Expected Associated person Production Role is => " + editPerson.experience.creativeExperience[0].productionRole[0]).toEqual(editPerson.experience.creativeExperience[0].productionRole[0]);
                expect.soft(requiredRecord.get("Production Department") , requiredRecord.get("First name") + " Expected Associated person Production Department is => " + editPerson.experience.creativeExperience[0].department).toEqual(editPerson.experience.creativeExperience[0].department);
            } else {
                expect.soft(1, "Associated Person updation Failed").toEqual(2);
            }
        })

    // @feature associated-people
    test("TC-3: Able to delete associated people of the Production plan", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedPeople"] },
        async ({ planningApp }) => {
           if (record < 1) {
                expect(record, "Associated Person of a Production should be deleted").toBeLessThan(1);
            } else {
                expect.soft(1, "Associated Person deletion Failed").toEqual(2);
            }
        });

    });
