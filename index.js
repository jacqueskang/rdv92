const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const log4js = require('log4js');
log4js.configure({
    appenders: { cheese: { type: 'file', filename: 'logs.txt' } },
    categories: { default: { appenders: ['cheese'], level: 'error' } }
});

var logger = log4js.getLogger();
logger.level = 'debug';

var args = process.argv.slice(2);

async function checkResponse(page, browser, response) {
    if (!response.ok()) {
        logger.error('Page showing error (see last-error.png). Exiting...');
        await page.screenshot({ path: 'last-error.png' });
        browser.close();
        process.exit(-1);
    }
}

async function clickButtonAndWaitForNavigation(page, browser, selector) {
    const [response, _] = await Promise.all([
        page.waitForNavigation(),
        page.click(selector),
    ]);
    await checkResponse(page, browser, response);
}

async function sendEmailAndQuit(page, browser, guichet, address) {
    logger.info(`PLACE DISPONIBLE!!! Sending email to '${address}'...`);
    var transporter = nodemailer.createTransport({
        host: 'email-smtp.eu-west-1.amazonaws.com',
        port: 587,
        secure: false,
        auth: {
            user: 'AKIA5PXSB3J4TYLESH7G',
            pass: args[0]
        }
    });

    let info = await transporter.sendMail({
        from: 'jacques.kang@sweeyoo.com',
        to: address,
        subject: `PLACE DISPONIBLE : guichet ${guichet} !!!`,
        text: 'http://www.hauts-de-seine.gouv.fr/booking/create/12083'
    });

    logger.info('Email sent. Taking screenshot (last-available.png) and exiting...');
    await page.screenshot({ path: 'last-available.png' });

    browser.close();
    process.exit(0);
}

(async () => {
    logger.info('Launching browser...');
    const browser = await puppeteer.launch();

    logger.info('Showing booking page...');
    const page = await browser.newPage();

    var response = await page.goto('http://www.hauts-de-seine.gouv.fr/booking/create/12083');
    await checkResponse(page, browser, response)

    logger.info('Clicking accept condition checkbox...');
    await page.click('input#condition');

    logger.info('Clicking next button...');
    await clickButtonAndWaitForNavigation(page, browser, 'input[name=nextButton]');

    var guichets = [{
        name: '1B',
        id: 'planning15255'
    }, {
        name: '4B',
        id: 'planning14673'
    }, {
        name: '3B',
        id: 'planning14806'
    }, {
        name: '2B',
        id: 'planning14932'
    }];

    for (const guichet of guichets) {
        logger.info(`Clicking guichet '${guichet.name}'...`);
        await page.click(`input#${guichet.id}`);

        logger.info('Clicking next button...');
        await clickButtonAndWaitForNavigation(page, browser, 'input[name=nextButton]');

        var formText = await page.$eval('form#FormBookingCreate', el => el.innerText);
        logger.info(`Text read: '${formText}'`);
        if (formText.search('n\'existe plus de plage!') < 0) {
            await sendEmailAndQuit(page, browser, '1B', 'jkang.perso@gmail.com');
        }

        logger.info(`No place available for guichet '${guichet.name}'. Clicking on finish button...`);
        await clickButtonAndWaitForNavigation(page, browser, 'input[name=finishButton]');

        logger.info('Clicking accept condition checkbox...');
        await page.click('input#condition');

        logger.info('Clicking next button...');
        await clickButtonAndWaitForNavigation(page, browser, 'input[name=nextButton]');
    }

    logger.info(`No place available. Exiting...`);
})();