/*
 * Le son 8 bits, joué sans fichier : quelques notes carrées.
 */

/** Un son 8 bits, joué à la volée sans fichier : quelques notes carrées. */
export function jouerNotes(audio: AudioContext, notes: Array<[number, number]>) {
  let t = audio.currentTime
  for (const [frequence, duree] of notes) {
    const osc = audio.createOscillator()
    const volume = audio.createGain()
    osc.type = 'square'
    osc.frequency.value = frequence
    volume.gain.setValueAtTime(0.04, t)
    volume.gain.exponentialRampToValueAtTime(0.0001, t + duree)
    osc.connect(volume).connect(audio.destination)
    osc.start(t)
    osc.stop(t + duree)
    t += duree
  }
}

export const SONS = {
  /** Un agent se met au travail : un petit bip montant. */
  travail: [
    [660, 0.07],
    [880, 0.09],
  ],
  /** Un agent tombe en échec : deux notes qui descendent. */
  echec: [
    [440, 0.18],
    [262, 0.3],
  ],
  /** Un visiteur pousse la porte : ding-dong. */
  sonnette: [
    [988, 0.2],
    [784, 0.35],
  ],
} satisfies Record<string, Array<[number, number]>>
