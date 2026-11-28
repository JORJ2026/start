"""Procedural original soundtrack and effects for The Deep Archive.
Requires Python 3 and NumPy. Run: python3 audio/make_audio.py
"""
from pathlib import Path
import wave
import numpy as np

ROOT=Path(__file__).resolve().parent
SR=24000

def write(name, signal, loop=False):
    signal=np.asarray(signal,dtype=np.float64)
    if signal.ndim==1: signal=np.stack([signal,np.roll(signal,int(SR*.009))*.96],axis=1)
    signal=np.tanh(signal*1.3)
    with wave.open(str(ROOT/name),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes(np.int16(np.clip(signal,-1,1)*32767).tobytes())

def score():
    seconds=32;n=SR*seconds;t=np.arange(n)/SR;rng=np.random.default_rng(418)
    raw=rng.normal(0,1,n//100+2);noise=np.interp(np.arange(n),np.arange(len(raw))*100,raw);noise/=np.max(abs(noise))+1e-9
    noise=np.convolve(noise,np.ones(180)/180,mode='same')
    sig=np.zeros(n)
    # A slowly unfolding D-minor / suspended harmony, warm low strings and glass partials.
    layers=[(55,.095,0,.007),(82.407,.056,1,.009),(110,.036,2,.006),(146.832,.042,3,.004),(164.814,.027,4,.005),(220,.021,2,.003),(293.665,.012,1,.002),(329.628,.008,5,.002)]
    for f,a,p,rate in layers:
        mod=.2*np.sin(2*np.pi*rate*t+p)+.07*np.sin(2*np.pi*rate*.41*t+p*1.7)
        sig+=a*np.sin(2*np.pi*f*t+mod)
        sig+=a*.21*np.sin(2*np.pi*f*2.003*t+mod*.7+p)
    # Four long bell swells drifting across the loop.
    for start,f in [(1.0,440),(7.8,587.33),(15.4,493.88),(23.2,659.25)]:
        age=np.maximum(t-start,0);env=np.exp(-age/5.4)*(t>=start)*(t<start+10)
        sig+=.027*env*(np.sin(2*np.pi*f*t)+.2*np.sin(2*np.pi*f*2.01*t))
    sig+=noise*.018
    sig*=np.minimum(1,np.minimum(t/2,(seconds-t)/2))
    # A real crossfade, keeping the ambient bed seamless at the loop boundary.
    length=SR*2
    for i in range(length):
        a=i/length;v=sig[i]*(1-a)+sig[-length+i]*a;sig[i]=v;sig[-length+i]=v
    write('archive-score.wav',sig)

def effects():
    # crystalline fragment pickup
    n=int(SR*1.5);t=np.arange(n)/SR;s=np.zeros(n)
    for f,a,d in [(783.99,.22,3.2),(1174.66,.13,2.8),(1567.98,.075,2.4),(2349.32,.025,1.8)]:s+=a*np.sin(2*np.pi*f*t)*np.exp(-d*t)
    write('star-chime.wav',s*np.minimum(1,t*150))
    # soft sonar strike with an airy filtered-noise tail
    n=int(SR*1.35);t=np.arange(n)/SR;rng=np.random.default_rng(11);raw=rng.normal(size=n);air=np.convolve(raw,np.ones(90)/90,mode='same');air/=max(abs(air))+1e-9
    sweep=185+280*np.exp(-t*3);phase=2*np.pi*np.cumsum(sweep)/SR
    s=.17*np.sin(phase)*np.exp(-t*3.3)+.12*np.sin(2*np.pi*660*t)*np.exp(-t*5)+.11*air*np.exp(-t*4)
    write('light-pulse.wav',s)
    # submerged impact: low, short, softened.
    n=int(SR*.8);t=np.arange(n)/SR;rng=np.random.default_rng(19);raw=rng.normal(size=n);air=np.convolve(raw,np.ones(160)/160,mode='same');air/=max(abs(air))+1e-9
    s=.27*np.sin(2*np.pi*(68-22*t)*t)*np.exp(-t*7)+.11*air*np.exp(-t*10)
    write('wraith-hit.wav',s)
    # muted, tactile navigation tick; two small wooden/glass partials, not a piercing beep.
    n=int(SR*.16);t=np.arange(n)/SR;s=.07*(np.sin(2*np.pi*540*t)+.3*np.sin(2*np.pi*810*t))*np.exp(-t*38)
    write('menu-tick.wav',s)
    effects_done=['star-chime.wav','light-pulse.wav','wraith-hit.wav','menu-tick.wav']
    return effects_done

if __name__=='__main__':
    score();effects();print('Generated original local score and four game effects.')
