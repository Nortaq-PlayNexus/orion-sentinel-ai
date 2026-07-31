import { describe, it, expect } from 'vitest'
import { handleCommand } from './orionAI'
import { useStore } from '../store'

describe('handleCommand', () => {
  it('replies to a Pacific Ocean scan directive and spawns events', async () => {
    useStore.setState({ anomalies: [], feed: [] })
    const reply = await handleCommand('Scan the Pacific Ocean for unusual structures.')
    expect(reply.title).toMatch(/PACIFIC/)
    expect(reply.body.length).toBeGreaterThan(20)
    expect(reply.chips.length).toBeGreaterThan(0)
    expect(useStore.getState().anomalies.length).toBeGreaterThan(0)
  }, 15000)

  it('replies to the help directive', async () => {
    const reply = await handleCommand('help')
    expect(reply.title).toMatch(/CAPABILITIES/)
  }, 15000)

  it('replies to the system status directive', async () => {
    const reply = await handleCommand('System status')
    expect(reply.title).toMatch(/DIAGNOSTIC/)
  }, 15000)

  it('replies to an unknown directive without crashing', async () => {
    const reply = await handleCommand('xyzzy plugh')
    expect(reply.title).toMatch(/DIRECTIVE RECEIVED/)
  }, 15000)
})
