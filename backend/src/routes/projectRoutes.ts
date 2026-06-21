import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { issueController } from '../controllers/issueController';
import { sprintController } from '../controllers/sprintController';
import { epicController } from '../controllers/epicController';
import { configController } from '../controllers/configController';
import { authenticate } from '../middleware/authMiddleware';
import { requirePermission, requireProjectMember } from '../middleware/permissionMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate);

// Projects
router.get('/', asyncHandler(projectController.list));
router.post('/', asyncHandler(projectController.create));
router.get('/:projectKey', requireProjectMember(), asyncHandler(projectController.getByKey));
router.put('/:projectKey', requirePermission('project:edit'), asyncHandler(projectController.update));
router.delete('/:projectKey', requirePermission('project:delete'), asyncHandler(projectController.remove));
router.post('/:projectKey/archive', requirePermission('project:archive'), asyncHandler(projectController.archive));

// Members
router.get('/:projectKey/members', requireProjectMember(), asyncHandler(projectController.listMembers));
router.post('/:projectKey/members', requirePermission('project:manage_members'), asyncHandler(projectController.addMember));
router.put('/:projectKey/members/:userId', requirePermission('project:manage_members'), asyncHandler(projectController.updateMember));
router.delete('/:projectKey/members/:userId', requirePermission('project:manage_members'), asyncHandler(projectController.removeMember));

// Issues (scoped to project)
router.get('/:projectKey/issues/export', requireProjectMember(), asyncHandler(issueController.exportCsv));
router.get('/:projectKey/issues', requireProjectMember(), asyncHandler(issueController.list));
router.post('/:projectKey/issues', requirePermission('issue:create'), asyncHandler(issueController.create));

// Sprints
router.get('/:projectKey/sprints', requireProjectMember(), asyncHandler(sprintController.list));
router.post('/:projectKey/sprints', requirePermission('sprint:create'), asyncHandler(sprintController.create));

// Epics
router.get('/:projectKey/epics', requireProjectMember(), asyncHandler(epicController.list));
router.post('/:projectKey/epics', requirePermission('epic:manage'), asyncHandler(epicController.create));

// Config: columns
router.post('/:projectKey/columns', requirePermission('project:configure'), asyncHandler(configController.createColumn));
router.put('/:projectKey/columns/reorder', requirePermission('project:configure'), asyncHandler(configController.reorderColumns));
router.put('/:projectKey/columns/:columnId', requirePermission('project:configure'), asyncHandler(configController.updateColumn));
router.delete('/:projectKey/columns/:columnId', requirePermission('project:configure'), asyncHandler(configController.deleteColumn));

// Config: labels
router.get('/:projectKey/labels', requireProjectMember(), asyncHandler(configController.listLabels));
router.post('/:projectKey/labels', requirePermission('project:configure'), asyncHandler(configController.createLabel));
router.delete('/:projectKey/labels/:labelId', requirePermission('project:configure'), asyncHandler(configController.deleteLabel));

// Config: custom fields
router.get('/:projectKey/custom-fields', requireProjectMember(), asyncHandler(configController.listCustomFields));
router.post('/:projectKey/custom-fields', requirePermission('project:configure'), asyncHandler(configController.createCustomField));
router.delete('/:projectKey/custom-fields/:fieldId', requirePermission('project:configure'), asyncHandler(configController.deleteCustomField));

export default router;
