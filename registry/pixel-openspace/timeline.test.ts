import { describe, expect, it } from 'vitest'
import { enEchecDepuis } from './timeline'

const passage = (heure: string, ok?: boolean) => ({ at: `2026-10-17T${heure}:00`, ok })

describe('enEchecDepuis', () => {
  it('remonte au premier raté de la série en cours', () => {
    expect(
      enEchecDepuis([passage('08:00'), passage('09:00', false), passage('10:00'), passage('11:00', false), passage('12:00', false)]),
    ).toBe('2026-10-17T11:00:00')
  })

  it('ne dit rien quand le dernier passage a marché, ou sans passage', () => {
    expect(enEchecDepuis([passage('08:00', false), passage('09:00')])).toBeNull()
    expect(enEchecDepuis([])).toBeNull()
  })
})
