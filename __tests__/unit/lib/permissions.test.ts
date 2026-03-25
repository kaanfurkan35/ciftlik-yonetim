import { describe, it, expect } from 'vitest'
import { hasPermission, checkPermission } from '@/lib/permissions'

describe('hasPermission', () => {
  describe('ADMIN', () => {
    it('has all permissions on all resources', () => {
      const resources = ['animals', 'health', 'breeding', 'milk', 'feeding', 'finance', 'pastures', 'tasks', 'notifications', 'users', 'settings', 'backup'] as const
      const actions = ['create', 'read', 'update', 'delete', 'manage'] as const

      for (const action of actions) {
        for (const resource of resources) {
          expect(hasPermission('ADMIN', action, resource)).toBe(true)
        }
      }
    })
  })

  describe('MANAGER', () => {
    it('can create animals, health, breeding, milk, feeding, finance, pastures, tasks, notifications', () => {
      const canCreate = ['animals', 'health', 'breeding', 'milk', 'feeding', 'finance', 'pastures', 'tasks', 'notifications'] as const
      for (const resource of canCreate) {
        expect(hasPermission('MANAGER', 'create', resource)).toBe(true)
      }
    })

    it('cannot create users, settings, backup', () => {
      expect(hasPermission('MANAGER', 'create', 'users')).toBe(false)
      expect(hasPermission('MANAGER', 'create', 'settings')).toBe(false)
      expect(hasPermission('MANAGER', 'create', 'backup')).toBe(false)
    })

    it('can read all resources', () => {
      const allResources = ['animals', 'health', 'breeding', 'milk', 'feeding', 'finance', 'pastures', 'tasks', 'notifications', 'users', 'settings', 'backup'] as const
      for (const resource of allResources) {
        expect(hasPermission('MANAGER', 'read', resource)).toBe(true)
      }
    })

    it('cannot manage anything', () => {
      expect(hasPermission('MANAGER', 'manage', 'animals')).toBe(false)
      expect(hasPermission('MANAGER', 'manage', 'settings')).toBe(false)
    })

    it('cannot delete notifications, users, settings, backup', () => {
      expect(hasPermission('MANAGER', 'delete', 'notifications')).toBe(false)
      expect(hasPermission('MANAGER', 'delete', 'users')).toBe(false)
      expect(hasPermission('MANAGER', 'delete', 'settings')).toBe(false)
      expect(hasPermission('MANAGER', 'delete', 'backup')).toBe(false)
    })
  })

  describe('WORKER', () => {
    it('can create animals, health, breeding, milk, feeding, tasks', () => {
      const canCreate = ['animals', 'health', 'breeding', 'milk', 'feeding', 'tasks'] as const
      for (const resource of canCreate) {
        expect(hasPermission('WORKER', 'create', resource)).toBe(true)
      }
    })

    it('cannot create finance, pastures, notifications', () => {
      expect(hasPermission('WORKER', 'create', 'finance')).toBe(false)
      expect(hasPermission('WORKER', 'create', 'pastures')).toBe(false)
      expect(hasPermission('WORKER', 'create', 'notifications')).toBe(false)
    })

    it('cannot delete anything', () => {
      const allResources = ['animals', 'health', 'breeding', 'milk', 'feeding', 'finance', 'pastures', 'tasks', 'notifications', 'users', 'settings', 'backup'] as const
      for (const resource of allResources) {
        expect(hasPermission('WORKER', 'delete', resource)).toBe(false)
      }
    })

    it('cannot read users, settings, backup', () => {
      expect(hasPermission('WORKER', 'read', 'users')).toBe(false)
      expect(hasPermission('WORKER', 'read', 'settings')).toBe(false)
      expect(hasPermission('WORKER', 'read', 'backup')).toBe(false)
    })
  })

  describe('VIEWER', () => {
    it('can read specific resources', () => {
      const canRead = ['animals', 'health', 'breeding', 'milk', 'feeding', 'finance', 'pastures', 'tasks', 'notifications'] as const
      for (const resource of canRead) {
        expect(hasPermission('VIEWER', 'read', resource)).toBe(true)
      }
    })

    it('cannot read users, settings, backup', () => {
      expect(hasPermission('VIEWER', 'read', 'users')).toBe(false)
      expect(hasPermission('VIEWER', 'read', 'settings')).toBe(false)
      expect(hasPermission('VIEWER', 'read', 'backup')).toBe(false)
    })

    it('cannot create, update, delete, or manage anything', () => {
      const actions = ['create', 'update', 'delete', 'manage'] as const
      for (const action of actions) {
        expect(hasPermission('VIEWER', action, 'animals')).toBe(false)
      }
    })
  })
})

describe('checkPermission', () => {
  it('does not throw for allowed action', () => {
    expect(() => checkPermission('ADMIN', 'create', 'animals')).not.toThrow()
  })

  it('throws for denied action with Turkish message', () => {
    expect(() => checkPermission('VIEWER', 'create', 'animals')).toThrow(
      'Bu işlem için yetkiniz bulunmuyor'
    )
  })
})
