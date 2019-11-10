# puppeteer-rec-video
Record video of headless browser screen using puppeteer (sample code)

# how to
1. enable screencast 
   ```
   await client.send('Page.startScreencast', {format: 'png', everyNthFrame: 1, quality: 100});
   ```
2. attach screencast event
   ```
   await client.on('Page.screencastFrame', async (args) => {});
   ```
3. create each frame as a png file
   ```
   await client.on('Page.screencastFrame', async (args) => {
        let timestamp = ("" + args.metadata.timestamp).replace('.', '').padEnd(16, "0");
        
        // write file each frame
        fs.writeFileSync(recordPath + '/' + timestamp + '.png', Buffer.from(args.data, 'base64'));
   });
   ```
4. make screenshots into video
   ```
   await new Promise((done, failed) => {
        let callback = async (error, stdout, stderr) => {
            if (error) {
                failed(err);
                return;
            }
            done();
        };
        // make screenshots into video
        let child = exec('cd ' + recordPath + '; ' + 'ffmpeg -pattern_type glob -i "*.png" -pix_fmt yuv420p -deinterlace -vf "scale=640:360" -vsync 1 -threads 0 -vcodec libx264 -g 60 -sc_threshold 0 -b:v 1024k -bufsize 1216k -maxrate 1280k -preset medium -profile:v main -tune film -f mp4 -y result.mp4', callback);
    });
   ```