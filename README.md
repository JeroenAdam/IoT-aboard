# Welcome to my IoT-aboard notes/repository

IoT (and open source software) have recently changed how boat owners consume and interact with data on their boat, I'm very excited to present you the beginning of my journey into this technology. 

 This summer, I have been implementing a bright LED display functioning as a (data) repeater for displaying critical navigation data.
It is mounted below deck at the mast support and readable at the steer about 8m. distance away. A short video [here](http://www.adambahri.com/images/DIY-repeater.mp4).

 I cycle through 5 views (engine temperature/compass course/wind speed/atmospheric pressure/speed through water) using a remote control. The LED display quickly scrolls the data repeatedly. The remote control actually is a mini router with the stock firmware replaced by OpenWRT + Mosquitto.
 
 It was quite easy to set up thanks to [Node-RED](https://nodered.org) (=browser-based editor), I only had to come up with some logical thinking and about 40 lines of [Javascript code](https://github.com/JeroenAdam/IoT-aboard/blob/master/snippets.js).


# My current project

Now I want to expand on this functionallity, I'll be diving into [Node.js](https://nodejs.org/en/about/), I'll code my first [Signal K Node server plugin](https://github.com/SignalK/signalk-server-node/blob/master/SERVERPLUGINS.md). Signal K is a modern and open data format for marine use with the [server node](https://github.com/SignalK/signalk-server-node) being built on Node.js and making use of [JSON](http://signalk.org/specification/1.0.4/doc/data_model.html), websockets and HTTP. This server is hosted on a Raspberry Pi running OpenPlotter (=Linux customized for marine use) and it provides a method for processing/sharing vessel/equipment information in a way that is friendly to wifi, cellphones, [tablets](http://signalk.org/images/gallery/test_image1.jpg) and the internet. 

My current project is the development of a plugin for such a Signal K server for the purpose of safety when navigating long routes.

I must confess that I don't fully trust my wife/autopilot handling the steer, but I didn't tell my wife about this yet :)
I'd like to see my LED display show compass heading (as I managed earlier with Node-RED) while the server plugin compares the current heading against a preset value. Let's say that the compass course deviates 20 degrees from my preset variable, then I want the LED display to display the unused pixels in red blinking.
Other kind of alarms would be thinkable as well:
- engine temperature reaching a certain treshold 
- wind speed reaching a certain treshold 
- water depth below a certain treshold 
- barometric pressure dropping at an alarming rate

The remote control (=mini router with button) will serve as an interface to acknowledge alarms. A long button press could be used to adjust tresholds. There is also a switch which can be set to 3 different positions.

Beside getting NMEA sensor data (compass course/wind speed/speed through water) to my [Signal K](https://github.com/SignalK/signalk-server-node) server via USB, I added atmospheric pressure readings coming from the IMU plugged on top of my second Raspberry Pi (=the one with the LED display on top). I also found a [library](https://github.com/mxtommy/SigkSens) to reprogram my ESP8266 unit to send engine temperature data to the Signal K server over wifi and some [instructions](https://slack-files.com/T02ENM6QA-FC5GCJ88H-a74ea73f0f) to add this unit as a (data) provider.

Next challenges:
- the Signal K server is mounted behind wood at the navigation station and is some distance away from the LED display which is plugged on top of my second Raspberry (=Pi Zero W), the LED display will need to be controllable over HTTP
- I'm not an experienced Javascript programmer, luckily I found a [npm module](https://github.com/guigrpa/sense-hat) for handling the LED display.

Future updates will show how this is progressing...

# My Hardware specs
- Intel NUC running [OpenCPN](https://opencpn.org) (open source Electronic Chart Display and Information System) + [16" USB-powered display](http://www.adambahri.com/images/NUCNavstation.jpg)
- Raspberry Pi with [OpenPlotter](http://www.sailoog.com/openplotter) (Linux server sharing GPS/AIS/compass/speed/wind/depth/engine temperature/atmospheric data)
- [Raspberry Pi Zero W](https://www.raspberrypi.org/products/raspberry-pi-zero-w/) + bright [LED matrix](https://www.raspberrypi.org/products/sense-hat/) for displaying critical navigation data (Linux/[Node-red](https://nodered.org)/MQTT)
- Mini router converted to remote control for Raspberry Pi Zero W ([OpenWRT](https://wiki.openwrt.org/toh/tp-link/tl-mr3020)/MQTT)
- Simrad BR24 radar (UDP reception from digital radar on [Intel NUC](http://www.adambahri.com/images/NUCNavstation.jpg) using [OpenCPN plugin](https://github.com/opencpn-radar-pi/radar_pi/))
# Installation notes
* OpenPlotter: Miniplex-3USB -> Serial tab -> assign USB device (auto-detected) to Kplex and set baud to 460800

* OpenPlotter: Enable MQTT -> localhost on port 1883, user/pass pi/raspberry

* OpenPlotter: Launch Signal K, install Signalk-Node-Red webapp in the admin UI, import flowOP (node-red) stored in this repository

* OpenWRT reset procedure: failsafe mode trigger after reset button blinking
  telnet to 192.168.1.1 (computer IP to 192.168.1.2 over LAN), jffs2reset -y, reboot -f
  Login with root/(empty) and set password same as OpenPlotter

* OpenWRT initial config: upload mosquitto packages using WinSCP to \tmp
  install mosquitto packages using opkg install name_of_the_package [link](https://archive.openwrt.org/chaos_calmer/15.05/ar71xx/generic/packages/)
  from base -> libuuid_2.25.2-4 + libpthread_0.9.33.2-1 + librt_0.9.33.2-1
  from packages -> libcares_1.10.0 + libmosquitto-nossl_1.4.7 +
  mosquitto-client-nossl_1.4.7 + mosquitto-nossl_1.4.7

* OpenWRT set to both AP mode and client mode following [link](https://stackoverflow.com/questions/29555697/luci-openwrt-wifi-bridge-client-how-to-configure)
  (In brief: fixed IP, bridge, scan and connect to OP AP, add another wifi interface = AP, set AP security)
  IP's: 10.10.10.2 LAN + 10.0.0.1xx Wifi (DHCP OpenPlotter), OpenWRT now reachable over http/ssh on 10.10.10.2 (even without LAN cable, if connected to OpenWRT AP)

  Continue instructions on [link](https://wiki.openwrt.org/doc/howto/hardware.button) and execute:
    ```
    uci add system button
    uci set system.@button[0].button=BTN_1
    uci set system.@button[0].action=released
    uci set system.@button[0].handler='mosquitto_pub -h 10.10.10.1 -t /test/switch-moved -u pi -P raspberry -m 1'
    uci add system button
    uci set system.@button[1].button=wps
    uci set system.@button[1].action=released
    uci set system.@button[1].handler='mosquitto_pub -h 10.10.10.1 -t /test/button-pressed -u pi -P raspberry -m 1'
    uci set system.@button[1].min=0
    uci set system.@button[1].max=0
    uci add system button
    uci set system.@button[2].button=wps
    uci set system.@button[2].action=released
    uci set system.@button[2].handler='mosquitto_pub -h 10.10.10.1 -t /test/switch-moved -u pi -P raspberry -m 1'
    uci set system.@button[2].min=1
    uci set system.@button[2].max=10
    uci add system button
    uci set system.@button[3].button=BTN_1
    uci set system.@button[3].action=pressed
    uci set system.@button[3].handler='mosquitto_pub -h 10.10.10.1 -t /test/switch-moved -u pi -P raspberry -m 1'
    uci commit system
    ```
  
* Headless Pi Zero W + node-red config -> flash latest Raspbian image on fully(!) formatted SD-card using Etcher

   Prepare for headless config via hotspot, use FR country code, see [link](https://www.mickmake.com/post/headless-pi-zero-w-2-easy-ways-of-connecting-tutorial), use Notepad++, not notepad.
  (If using ZTE hotspot -> terminal on phone -> su -> cd /data/misc/DHCP -> cat dnsmasq.leases -> ssh pi@192.168.1.xxx)
  
  edit /etc/dhcpcd.conf and reboot
    ```
    #static IP configuration
    interface wlan0
    static ip_address=10.10.10.4/24
    static routers=10.10.10.1
    static domain_name_servers=10.10.10.1
    ```
   ssh pi@10.10.10.4
 
   sudo raspi-config (and enable VNC), use VNC Viewer to remote in
 
   install node-red-contrib-counter (offline copy) and node-red-dashboard (OpenPlotter) by copying files  over to /home/pi/.node-red/node_modules
 
   create /home/pi/filestowatch/switch-moved/switch-moved.txt and /home/pi/filestowatch/button-pressed/button-pressed.txt
  
   node-red-start
  
   import flowPiZeroW (node-red) stored in this repository, MQTT nodes are set to connect to OpenPlotter (signalk-node-red), don't forget MQTT Security = OP user/password
   
   sudo systemctl enable nodered.service

# ESP8266 unit + DS18B20 Temperature sensor configuration
 
  My ESP8266 unit: AI-Thinker ESP-01 with 1MB memory

  Preparation: I flashed ai-thinker-v1.1.1.bin using esp8266_flasher.exe with with GPIO0 and GND connected together, cables not longer than 20cm, prerequisite: 3.3V modified TTL to USB adapter at hand and [driver](http://www.arduined.eu/ch340g-converter-windows-7-driver-download/) installed. For connections, follow this [diagram](https://www.elec-cafe.com/temperature-sensor-on-the-web-with-esp8266-and-ds18b20), 4K7 resistor between GPIO-2 and VCC is needed

  Procedure:
   Install git, run git clone https://github.com/mxtommy/SigkSens
   follow the 6 steps on https://randomnerdtutorials.com/how-to-install-esp8266-board-arduino-ide
   follow step 6 + 7 on https://slack-files.com/T02ENM6QA-FC5GCJ88H-a74ea73f0f
   the three below libraries are not published in the library manager, so for each of them: run a git clone + zip it + add .zip library (using Arduino IDE)
    -> Reactduino/Reactduino / me-no-dev/ESPAsyncWebServer / me-no-dev/ESPAsyncTCP
    For any ESP-01 unit, uncomment line 64 of config.h + change the number 13 to 2 (using Arduino IDE)
    Assure Arduino IDE is set to communicate with 'Generic ESP8266 module' and flash size set to 1M and 64K SPIFFS
    Proceed with flashing the sketch
    Connect to the 'Unconfigured sensor' wifi and launch http://192.168.4.1
    Configure Wifi by entering OpenPlotter SID and password, hostname set to ESP1
    Launch /var/log/syslog on OpenPlotter and search for the latest DHCPOFFER, note the IP address
    Run the below 5 web requests (but replace with your IP from the previous step), the browser should return "success" for each of them
      http://10.10.10.149/setNewHostname?hostname=ESP1
      http://10.10.10.149/setSignalKPort?port=3000
      http://10.10.10.149/setSignalKHost?host=10.10.10.1
      http://10.10.10.149/setSensorAttr?address=28:FF:79:26:81:16:04:41&attrName=tempK&path=propulsion.eng.temperature (replace with address of your sensor, keep or replace path as appropriate)
      http://10.10.10.149/setSignalKToken?... (replace ... with token obtained by executing the below command in home directory on OpenPlotter)
      signalk-generate-token -u openplotter -e "999d" -s ./.signalk/security.json

   Last steps: power off/on ESP unit, launch Signal K and see if a new 'ws' provider is shown

   Troubleshooting: use tcpdump (OpenPlotter) and Serial monitor (Arduino IDE), assure Arduino IDE is able to communicate with your ESP8266 module by reviewing the settings appropriate to your unit
