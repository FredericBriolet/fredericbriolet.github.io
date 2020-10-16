var settings = {
    portamento: 0.0,
    masterVolumeBase: 1,
    masterVolumeReverb: 1,
}
  
const gui = new dat.GUI();
gui.add(settings, 'portamento', 0.0, 0.3, 0.01);
gui.add(settings, 'masterVolumeBase', 0.0, 1.0, 0.01);
gui.add(settings, 'masterVolumeReverb', 0.0, 1.0, 0.01);