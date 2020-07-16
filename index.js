const fs = require('fs');
const xlsx = require('node-xlsx');
const superagent = require('superagent')
var request = require("request");
var Promise = require("bluebird");
require('superagent-proxy')(superagent);

// 小饼干～
var cookie;
// 所有的关键字
var keyword = ["人像", "人脸"]
// 获取excle里已有的数据
var info = xlsx.parse("./resut.xlsx");
// 搜索关键词
var searchString = keyword[info.length];
// 所有账号
var user = [1111, 2222]
// 每次随机的账号
var username = user[Math.floor(Math.random() * user.length)];
// 固定密码
var password = 'a123456';
// 代理ip
var proxy = '';
// 所有数据
var addInfo = {
  name: searchString,
  data: [
    ['title', 'href', 'datainfo']
  ]
};
// 请填写无忧代理订单号
var order = '532ee9c8fda8e92daeaee7bea98b0bcd';
// 要测试的网址
var targetURL = 'http://ip.chinaz.com/getip.aspx';
// 请求超时时间
var timeout = 8000;
// 测试次数
var testTime = 5;
// 间隔多少毫秒调用一次接口
var sleepTime = 5000;
// 获取代理ip的网站
var apiURL = 'http://api.ip.data5u.com/dynamic/get.html?order=' + order + '&sep=3';

// 获取代理ip异步方法
function getProxyList() {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'GET',
      url: apiURL,
      gzip: true,
      encoding: null,
      headers: {},
    };

    request(options, function (error, response, body) {
      try {
        if (error) throw error;
        var ret = (body + '').match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}/g);
        resolve(ret);
      } catch (e) {
        return reject(e);
      }
    });
  });
}

function execute() {
  // 调用获取代理ip方法
  getProxyList().then(function (proxyList) {
    var targetOptions = {
      method: 'GET',
      url: targetURL,
      timeout: timeout,
      encoding: null,
    };

    proxyList.forEach(function (proxyurl) {
      // 修改全局变量代理ip
      proxy = 'http://' + proxyurl
      console.log(proxy, 'ip')
      var startTimestamp = (new Date()).valueOf();
      targetOptions.proxy = 'http://' + proxyurl;
      request(targetOptions, function (error, response, body) {
        try {
          if (error) throw error;
          body = body.toString();
          var endTimestamp = (new Date()).valueOf();
          var time = endTimestamp - startTimestamp
          getCookie();
        } catch (e) {
          console.error(e);
        }
      });
    });
  }).catch(e => {
    console.log(e);
  }).finally(() => {})
}

// execute();

// 获取登陆饼干
function getCookie() {
  // 调用网站的登陆方法
  superagent.post('https://www.')
    // 设置代理ip
    .proxy(proxy)
    .type('form')
    .send({
      // 需要发送的数据
      reqType: 'phoneLogin',
      phone: username,
      password: password,
    })
    .end(function (err, res) {
      if (err) {
        handleErr(err.message);
        return;
      }
      cookie = res.header['set-cookie']; //从response中得到cookie 并赋值到全局变量
      getData();
    })
}

async function getData() {
  for (let i = 1; i <= 10; i++) {
    // 调用招标列表的接口
    const response = await superagent.post('https://www.')
      // 设置代理
      .proxy(proxy)
      .type('form')
      // 设置饼干
      .set('Cookie', cookie)
      // 发送数据
      .send({
        pageNumber: i,
        reqType: 'bidSearch',
        searchvalue: searchString,
        area: '',
        subtype: '',
        publishtime: '',
        selectType: 'title',
        minprice: '',
        maxprice: '',
        industry: '',
        tabularflag: 'Y',
      })
    if (JSON.parse(response.text).list !== null) {
      // 转译需要的数据 将数据转换成json
      let addData = JSON.parse(response.text);
      // 取出数据中的list list为我们需要的数据
      let list = addData.list;
      list.map((res) => {
        // 提取我们需要的 title dataid href为拼接后的数据
        let getInfo = [res.title, 'https://www/' + res._id + '.html', res._id]
        // 将提取出的数据存放到所有数据中
        addInfo.data.push(getInfo)
      })
      console.log(i)
    } else {
      // 同上 这里是不够10页数据的时候
      info.push(addInfo)
      console.log(username, 'username')
      console.log(searchString, 'searchString')
      var buffer = xlsx.build(info);
      fs.writeFile('./resut.xlsx', buffer, function (err) {
        if (err)
          throw err;
      });
      return;
    }
  }

  info.push(addInfo)
  console.log(username, 'username')
  console.log(searchString, 'searchString')
  // 修改excel文件
  var buffer = xlsx.build(info);
  fs.writeFile('./resut.xlsx', buffer, function (err) {
    if (err)
      throw err;
  });
}


execute()