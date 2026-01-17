import { expect, test } from "../../../../../src/core/fixtures";
import { Contact, Production } from "../../../../../test-data/types";
import { getIndexOfRecordInMap } from "../../../../../src/core/common-actions";

// TODO: here we must select contact of type "Account"
test.describe.serial("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedPeople"] }, () => {
   

    // @feature associated-people
    test("TC-1: Able to add existing people as Key people to the Production plan", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedPeople"] },
        async ({ planningApp }) => {
           
            expect.soft(isVisible, "Newly added person added as Key Person => " + person.basicInformation.name).toBeTruthy();
        });

    // @feature associated-people
    test("TC-2: Able to see added existing person as a key person is displayed in associated people list of the Production plan", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedPeople"] },
        async ({ planningApp }) => {
           

                if (record > -1) {
                    //TODO: make it work for all fields
                    expect.soft(requiredRecord.get("First name") + " " + requiredRecord.get("Last name"), "Expected Associated person name is => " + person.basicInformation.name).toEqual(person.basicInformation.name);
                    //expect.soft(requiredRecord.get("Email") , requiredRecord.get("First name") + " Expected Associated person email is => " + person.basicInformation.email).toEqual(person.basicInformation.email);
                    expect.soft(requiredRecord.get("Organization") || undefined , requiredRecord.get("First name") + " Expected Associated person Organization is => " + person.experience.professionalExperience[0].organization).toEqual(person.experience.professionalExperience[0].organization || undefined);
                    expect.soft(requiredRecord.get("Title") || undefined, requiredRecord.get("First name") + " Expected Associated person Title is => " + person.experience.professionalExperience[0].title).toEqual(person.experience.professionalExperience[0].title || undefined);
                    expect.soft(requiredRecord.get("Department") || undefined, requiredRecord.get("First name") + " Expected Associated person Department is => " + person.experience.professionalExperience[0].department).toEqual(person.experience.professionalExperience[0].department || undefined);
                    //expect.soft(requiredRecord.get("Professional Role") , requiredRecord.get("First name") + " Expected Associated person Role is => " + person[i].experience.professionalExperience[0].roles[0]).toEqual(person[i].experience.professionalExperience[0].roles[0]);
                    //expect.soft(requiredRecord.get("Production Role") , requiredRecord.get("First name") + " Expected Associated person Production Role is => " + person[i].experience.creativeExperience[0].productionRole[0]).toEqual(person[i].experience.creativeExperience[0].productionRole[0]);
                    expect.soft(requiredRecord.get("Production Department") || undefined, requiredRecord.get("First name") + " Expected Associated person Production Department is => " + person.experience.creativeExperience[0].department).toEqual(person.experience.creativeExperience[0].department || undefined);
                    //expect.soft(requiredRecord.get("Phone"), "Expected Associated person Production Department is => " + contact.phone).toEqual(contact.phone); TODO: Pending to cover this field throughout tests
                } else {
                    expect.soft(1, "Associated Person creation Failed").toEqual(2);
                }
           // }
        });

    // @feature associated-people
    test("TC-3: Able to remove person from a Key person of the Production plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@associatedPeople"] },
        async ({ planningApp }) => {
           
            expect.soft(isVisible, "Person removed from a Key Person of the Production plan => " + person.basicInformation.name).toBeFalsy();
        });

    // @feature associated-people
    test("TC-4: Able to see removed key person in the associated people list of the Production plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@regression", "@associatedPeople"] },
        async ({ planningApp }) => {
          
            if (record > -1) {
                expect.soft(requiredRecord.get("First name") + " " + requiredRecord.get("Last name"), "Expected Associated person name is => " + person.basicInformation.name).toEqual(person.basicInformation.name);
                //TODO: make it work for all fields
                //expect.soft(requiredRecord.get("Email") , requiredRecord.get("First name") + " Expected Associated person email is => " + person.basicInformation.email).toEqual(person.basicInformation.email);
                // expect.soft(requiredRecord.get("Organization"), requiredRecord.get("First name") + " Expected Associated person Organization is => " + contact.experience.professionalExperience[0].organization).toEqual(contact.experience.professionalExperience[0].organization);
                // expect.soft(requiredRecord.get("Title"), requiredRecord.get("First name") + " Expected Associated person Title is => " + contact.experience.professionalExperience[0].title).toEqual(contact.experience.professionalExperience[0].title);
                // expect.soft(requiredRecord.get("Department"), requiredRecord.get("First name") + " Expected Associated person Department is => " + contact.experience.professionalExperience[0].department).toEqual(contact.experience.professionalExperience[0].department);
                //expect.soft(requiredRecord.get("Professional Role") , requiredRecord.get("First name") + " Expected Associated person Role is => " + contact.experience.professionalExperience[0].roles[0]).toEqual(contact.experience.professionalExperience[0].roles[0]); TODO: Handle this field
                //expect.soft(requiredRecord.get("Production Role") , requiredRecord.get("First name") + " Expected Associated person Production Role is => " + contact.experience.creativeExperience[0].productionRole[0]).toEqual(contact.experience.creativeExperience[0].productionRole[0]); TODO: Handle this field
                //expect.soft(requiredRecord.get("Production Department"), requiredRecord.get("First name") + " Expected Associated person Production Department is => " + contact.experience.creativeExperience[0].department).toEqual(contact.experience.creativeExperience[0].department);
                // expect.soft(requiredRecord.get("Phone"), "Expected Associated person Production Department is => " + contact.phone).toEqual(contact.phone); TODO: Pending to cover this field throughout tests
            } else {
                expect.soft(1, "Associated Person removed from Production plan.").toEqual(2);
            }
        });

    });