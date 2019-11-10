const puppeteer = require('puppeteer');
const fs = require('fs');
const { exec } = require('child_process');

(async () => {
	let launchOption = {
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080']
    };

    const browser = await puppeteer.launch(launchOption);
    const page = (await browser.pages())[0];
    const client = await page.target().createCDPSession();

    // start screencast 
    await client.send('Page.startScreencast', {format: 'png', everyNthFrame: 1, quality: 100});
    let recordPath = './record'
    // attach screencast frame event
    await client.on('Page.screencastFrame', async (args) => {
        let timestamp = ("" + args.metadata.timestamp).replace('.', '').padEnd(16, "0");
        
        // write file each frame
        fs.writeFileSync(recordPath + '/' + timestamp + '.png', Buffer.from(args.data, 'base64'));
    });

    // do something

    await page.goto('https://naver.com', {
		waitUntil: 'networkidle2'
    });
    
    // end screencast
    await client.send('Page.stopScreencast');
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

    await browser.close();

})();
