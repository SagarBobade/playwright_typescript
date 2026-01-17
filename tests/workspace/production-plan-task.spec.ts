import { getIndexOfRecordInMap } from "../../../../src/core/common-actions";
import { expect, test } from "../../../../src/core/fixtures";
import { createNewActivity } from "../../../../test-data/data-creation-utils";
import { Production, ProductionActivity } from "../../../../test-data/types";



test.describe.skip("ProductionPlanning", { tag: ["@planningApp", "@sanity", "@workspace", "@plan"] }, () => {
 


    // @feature Task
    test("TC-1: Able to create a Task of type 'Task' to the Production Plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@task"] },
        async ({ planningApp }) => {
     
                if (record > -1) {
                    expect.soft(requiredRecord.get("Name"), "Expected Task name is => " + task.name).toEqual(task.name);
                    //expect.soft(new Date(requiredRecord.get("Start Date")).toLocaleDateString(), "Expected Task start date is => " + task.startDate.toLocaleDateString()).toEqual(task.startDate.toLocaleDateString());
                    //expect.soft(new Date(requiredRecord.get("Due Date")).toLocaleDateString(), "Expected Task due date is => " + task.endDate.toLocaleDateString()).toEqual(task.endDate.toLocaleDateString());
                    expect.soft(requiredRecord.get("Status"), "Expected Task status is => " + task.trackStatus).toEqual(task.trackStatus);
                    expect.soft(requiredRecord.get("Type"), "Expected Task type is => " + task.type).toEqual(task.type);
                    expect.soft(isToggleOn, "Expected Action toggle state is OFF.").toBeFalsy();
                }
                else {
                    expect.soft(1, "Production Task creation Failed").toEqual(2);
                }
            } else {
                expect.soft(1, "Production Task creation Failed").toEqual(2);
            }
        });

    // @feature Task
    test("TC-2: Able to create a Task of type 'Milestone' to the Production plan.", { tag: ["@planningApp", "@sanity", "@workspace", "@task"] },
        async ({ planningApp }) => {
           if (isTaskVisible) {
                const isToggleOn = await planningApp.productionTasks.checkToggleState(task2.name);

                gridData = await planningApp.productionTasks.getTableData();
                record = await getIndexOfRecordInMap(task2, gridData);
                requiredRecord = gridData[record];

                if (record > -1) {
                    expect.soft(requiredRecord.get("Name"), "Expected Task name is => " + task2.name).toEqual(task2.name);
                    expect.soft(new Date(requiredRecord.get("Start Date")).toLocaleDateString(), "Expected Task start date is => " + task2.startDate.toLocaleDateString()).toEqual(task2.startDate.toLocaleDateString());
                    expect.soft(requiredRecord.get("Status"), "Expected Task status is => " + task2.trackStatus).toEqual(task2.trackStatus);
                    expect.soft(requiredRecord.get("Type"), "Expected Task type is => " + task2.type).toEqual(task2.type);
                    expect.soft(isToggleOn, "Expected Action toggle state is OFF.").toBeFalsy();
                } else {
                    expect.soft(1, "Production Milestone creation Failed").toEqual(2);
                }
            } else {
                expect.soft(1, "Production Milestone creation Failed").toEqual(2);
            }
        });

    // @feature Task
    test("TC-3: Able to edit the recently created Task.", { tag: ["@planningApp", "@sanity", "@workspace", "@task"] },
        async ({ planningApp }) => {
             if (isTaskVisible) {
                const isToggleOn = await planningApp.productionTasks.checkToggleState(editTask1.name);

                gridData = await planningApp.productionTasks.getTableData();
                record = await getIndexOfRecordInMap(editTask1, gridData);
                requiredRecord = gridData[record];

                if (record > -1) {
                    expect.soft(requiredRecord.get("Name"), "Expected Task name is => " + editTask1.name).toEqual(editTask1.name);
                    //expect.soft(new Date(requiredRecord.get("Start Date")).toLocaleDateString(), "Expected Task start date is => " + editTask1.startDate.toLocaleDateString()).toEqual(editTask1.startDate.toLocaleDateString());
                    //expect.soft(new Date(requiredRecord.get("Due Date")).toLocaleDateString(), "Expected Task due date is => " + editTask1.endDate.toLocaleDateString()).toEqual(editTask1.endDate.toLocaleDateString());
                    expect.soft(requiredRecord.get("Status"), "Expected Task status is => " + editTask1.trackStatus).toEqual(editTask1.trackStatus);
                    expect.soft(isToggleOn, "Expected Action toggle state is OFF.").toBeFalsy();
                } else {
                    expect.soft(1, "Production Milestone updation Failed").toEqual(2);
                }
            } else {
                expect.soft(1, "Production Milestone updation Failed").toEqual(2);
            }
        });

    // @feature Task
    test("TC-4: Able to edit the recently created Milestone.", { tag: ["@planningApp", "@sanity", "@workspace", "@task"] },
        async ({ planningApp }) => {
          if (isTaskVisible) {
                const isToggleOn = await planningApp.productionTasks.checkToggleState(editTask2.name);

                gridData = await planningApp.productionTasks.getTableData();
                record = await getIndexOfRecordInMap(editTask2, gridData);
                requiredRecord = gridData[record];

                if (record > -1) {
                    expect.soft(requiredRecord.get("Name"), "Expected Task name is => " + editTask2.name).toEqual(editTask2.name);
                    expect.soft(new Date(requiredRecord.get("Start Date")).toLocaleDateString(), "Expected Task start date is => " + editTask2.startDate.toLocaleDateString()).toEqual(editTask2.startDate.toLocaleDateString());
                    expect.soft(requiredRecord.get("Status"), "Expected Task status is => " + editTask2.trackStatus).toEqual(editTask2.trackStatus);
                    expect.soft(requiredRecord.get("Type"), "Expected Task type is => " + editTask2.type).toEqual(editTask2.type);
                    expect.soft(isToggleOn, "Expected Action toggle state is OFF.").toBeFalsy();
                } else {
                    expect.soft(1, "Production Milestone updation Failed").toEqual(2);
                }
            } else {
                expect.soft(1, "Production Milestone updation Failed").toEqual(2);
            }
        });

    // @feature Task
    test("TC-5: Able to filter Tasks based on the Status.", { tag: ["@planningApp", "@sanity", "@workspace", "@task"] },
        async ({ planningApp }) => {
        
            gridData = await planningApp.productionTasks.getTableData();
            try {
                gridData.map((record) => {
                    expect.soft(record.get("Status"), "Expected Task status is => " + editTask1.trackStatus).toEqual(editTask1.trackStatus);
                });
            } catch (error) {
                expect.soft(1, "Failed to filter tasks based on Status." + error).toEqual(2);
            }
        });

    // @feature Task
    test("TC-6: Able to mark the created Task as Done.", { tag: ["@planningApp", "@sanity", "@workspace", "@task"] },
        async ({ planningApp }) => {
             await planningApp.productionResourceSchedule.navigateToTasksTabInProductionPlan();
            isTaskVisible = await planningApp.productionTasks.searchTask(editTask1.name);
            if (isTaskVisible) {
                await planningApp.productionTasks.toggleTaskAction(editTask1.name);
                const isToggleOn = await planningApp.productionTasks.checkToggleState(editTask1.name);

                gridData = await planningApp.productionTasks.getTableData();
                record = await getIndexOfRecordInMap(editTask1, gridData);
                requiredRecord = gridData[record];

                if (record > -1) {
                    expect.soft(requiredRecord.get("Name"), "Expected Task name is => " + editTask1.name).toEqual(editTask1.name);
                    expect.soft(requiredRecord.get("Status"), "Expected Task status is => " + "Done").toEqual("Done");
                    expect.soft(isToggleOn, "Expected Action toggle state is ON.").toBeTruthy();
                } else {
                    expect.soft(1, "Production Task marking as Done Failed").toEqual(2);
                }
            } else {
                expect.soft(1, "Production Task marking as Done Failed").toEqual(2);
            }
        });

    // @feature Task
    test("TC-7: Able to change the Task status to In-Progress.", { tag: ["@planningApp", "@sanity", "@workspace", "@task"] },
        async ({ planningApp }) => {
            if (isTaskVisible) {
                await planningApp.productionTasks.toggleTaskAction(editTask1.name);
                const isToggleOn = await planningApp.productionTasks.checkToggleState(editTask1.name);

                gridData = await planningApp.productionTasks.getTableData();
                record = await getIndexOfRecordInMap(editTask1, gridData);
                requiredRecord = gridData[record];

                if (record > -1) {
                    expect.soft(requiredRecord.get("Name"), "Expected Task name is => " + editTask1.name).toEqual(editTask1.name);
                    expect.soft(requiredRecord.get("Status"), "Expected Task status is => " + "In Progress").toEqual("In Progress");
                    expect.soft(isToggleOn, "Expected Action toggle state is OFF.").toBeFalsy();
                } else {
                    expect.soft(1, "Production Task marking as Done Failed").toEqual(2);
                }
            } else {
                expect.soft(1, "Production Task marking as Done Failed").toEqual(2);
            }
        });

    // @feature Task
    test("TC-8: Able to delete the recently edited Task.", { tag: ["@planningApp", "@sanity", "@workspace", "@task"] },
        async ({ planningApp }) => {
          if (!isTaskVisible) {
                gridData = await planningApp.productionTasks.getTableData();
                record = await getIndexOfRecordInMap(task, gridData);

                if (record < 1) {
                    expect(record, "Task of a Production plan should be deleted").toBeLessThan(1);
                } else {
                    expect.soft(1, "Production Task deletion Failed").toEqual(2);
                }
            } else {
                expect.soft(1, "Production Task deletion Failed").toEqual(2);
            }
        });
});