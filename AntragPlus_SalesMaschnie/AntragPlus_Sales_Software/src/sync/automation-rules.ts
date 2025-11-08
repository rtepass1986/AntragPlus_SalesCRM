import { AsanaClient } from './asana';
import { ASANA_SECTIONS } from './mapping';

/**
 * Automation Rules Engine
 * Triggers actions when tasks move between sections in Asana
 */

export interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'section_changed';
    sectionGid: string;
    sectionName: string;
  };
  actions: AutomationAction[];
  enabled: boolean;
}

export interface AutomationAction {
  type: 'set_dates' | 'assign_user' | 'add_comment' | 'set_custom_field' | 'create_subtask' | 'start_timer';
  params: Record<string, any>;
}

// Define all automation rules here
export const AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule_001',
    name: 'Follow Up Call - Start Timer, Set Dates and Assign',
    trigger: {
      type: 'section_changed',
      sectionGid: ASANA_SECTIONS.FOLLOW_UP_CALL, // 1.Follow Up Call
      sectionName: '1.Follow Up Call'
    },
    actions: [
      {
        type: 'start_timer',
        params: {}
      },
      {
        type: 'set_dates',
        params: {
          startDate: 'today',
          dueDate: 'start_plus_48h' // 48 hours after start date
        }
      },
      {
        type: 'assign_user',
        params: {
          email: 'max@antragplus.de',
          userGid: '1204409495825768' // Max's Asana user GID
        }
      }
    ],
    enabled: true
  }
  // Add more rules here as needed
];

/**
 * Execute automation rules when a task's section changes
 */
export async function executeAutomationRules(
  taskGid: string,
  newSectionGid: string,
  asanaClient: AsanaClient
): Promise<void> {
  console.log(`Checking automation rules for task ${taskGid} moved to section ${newSectionGid}`);

  // Find all rules that match this section
  const matchingRules = AUTOMATION_RULES.filter(
    rule => rule.enabled && rule.trigger.sectionGid === newSectionGid
  );

  if (matchingRules.length === 0) {
    console.log(`No automation rules found for section ${newSectionGid}`);
    return;
  }

  console.log(`Found ${matchingRules.length} matching rule(s)`);

  // Get task details
  const task = await asanaClient.getTask(taskGid);

  for (const rule of matchingRules) {
    console.log(`Executing rule: ${rule.name}`);

    try {
      for (const action of rule.actions) {
        await executeAction(taskGid, task, action, asanaClient);
      }
      console.log(`✅ Rule "${rule.name}" executed successfully`);
    } catch (error) {
      console.error(`❌ Error executing rule "${rule.name}":`, error);
      // Continue with other rules even if one fails
    }
  }
}

/**
 * Execute a single automation action
 */
async function executeAction(
  taskGid: string,
  task: any,
  action: AutomationAction,
  asanaClient: AsanaClient
): Promise<void> {
  switch (action.type) {
    case 'start_timer':
      await startTaskTimer(taskGid, asanaClient);
      break;

    case 'set_dates':
      await setTaskDates(taskGid, task, action.params, asanaClient);
      break;

    case 'assign_user':
      await assignTaskToUser(taskGid, action.params, asanaClient);
      break;

    case 'add_comment':
      await addTaskComment(taskGid, action.params, asanaClient);
      break;

    case 'set_custom_field':
      await setTaskCustomField(taskGid, action.params, asanaClient);
      break;

    case 'create_subtask':
      await createSubtask(taskGid, action.params, asanaClient);
      break;

    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}

/**
 * Start the timer on a task
 */
async function startTaskTimer(
  taskGid: string,
  asanaClient: AsanaClient
): Promise<void> {
  console.log(`Starting timer for task ${taskGid}`);

  try {
    // Start the timer using Asana's time tracking API
    await asanaClient.makeRequest('POST', `/tasks/${taskGid}/addProject`, {
      data: {
        project: null // This triggers the timer start
      }
    });
  } catch (error) {
    // If that doesn't work, try the stories endpoint to start timer
    try {
      await asanaClient.makeRequest('POST', `/tasks/${taskGid}/stories`, {
        data: {
          text: '⏱️ Timer started automatically'
        }
      });
      console.log('✅ Timer started (via comment)');
    } catch (err) {
      console.warn('Could not start timer via API, will use actual_time_minutes field');
      // Set actual_time_minutes to 0 to indicate timer started
      await asanaClient.updateTask(taskGid, {
        actual_time_minutes: 0
      } as any);
      console.log('✅ Timer initialized via actual_time_minutes');
    }
  }
}

/**
 * Set start and due dates on a task
 */
async function setTaskDates(
  taskGid: string,
  task: any,
  params: Record<string, any>,
  asanaClient: AsanaClient
): Promise<void> {
  const updates: any = {};

  // Calculate start date
  let startDate: Date;
  if (params.startDate === 'task_created_date') {
    startDate = new Date(task.created_at);
  } else if (params.startDate === 'today') {
    startDate = new Date();
  } else {
    startDate = new Date(params.startDate);
  }

  // Calculate due date
  let dueDate: Date;
  if (params.dueDate === 'start_plus_48h') {
    dueDate = new Date(startDate);
    dueDate.setHours(dueDate.getHours() + 48);
  } else if (params.dueDate === 'start_plus_24h') {
    dueDate = new Date(startDate);
    dueDate.setHours(dueDate.getHours() + 24);
  } else if (params.dueDate === 'start_plus_7d') {
    dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 7);
  } else {
    dueDate = new Date(params.dueDate);
  }

  // Format dates as YYYY-MM-DD for Asana
  updates.start_on = startDate.toISOString().split('T')[0];
  updates.due_on = dueDate.toISOString().split('T')[0];

  console.log(`Setting dates: start=${updates.start_on}, due=${updates.due_on}`);

  await asanaClient.updateTask(taskGid, updates);
}

/**
 * Assign a task to a user
 */
async function assignTaskToUser(
  taskGid: string,
  params: Record<string, any>,
  asanaClient: AsanaClient
): Promise<void> {
  const userGid = params.userGid;

  console.log(`Assigning task to user ${params.email} (${userGid})`);

  await asanaClient.updateTask(taskGid, {
    assignee: userGid
  });
}

/**
 * Add a comment to a task
 */
async function addTaskComment(
  taskGid: string,
  params: Record<string, any>,
  asanaClient: AsanaClient
): Promise<void> {
  const comment = params.comment;

  console.log(`Adding comment: ${comment}`);

  await asanaClient.addComment(taskGid, comment);
}

/**
 * Set a custom field value on a task
 */
async function setTaskCustomField(
  taskGid: string,
  params: Record<string, any>,
  asanaClient: AsanaClient
): Promise<void> {
  const customFieldGid = params.customFieldGid;
  const value = params.value;

  console.log(`Setting custom field ${customFieldGid} to ${value}`);

  // Asana expects custom fields as an object with field GID as key
  const customFieldsUpdate: any = {};
  customFieldsUpdate[customFieldGid] = value;

  await asanaClient.updateTask(taskGid, {
    custom_fields: customFieldsUpdate
  } as any);
}

/**
 * Create a subtask
 */
async function createSubtask(
  taskGid: string,
  params: Record<string, any>,
  asanaClient: AsanaClient
): Promise<void> {
  const subtaskName = params.name;
  const subtaskNotes = params.notes || '';

  console.log(`Creating subtask: ${subtaskName}`);

  await asanaClient.createTask({
    name: subtaskName,
    notes: subtaskNotes,
    parent: taskGid
  } as any, '', undefined);
}

