#!/usr/bin/python
import sys
import Adafruit_DHT

sensor = Adafruit_DHT.AM2302
pin = 17
humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)

if humidity is not None and temperature is not None:
	print '{{ \"temperature\" : \"{0:0.1f}\",  \"humidity\" : \"{1:0.1f}\" }}'.format(temperature, humidity)
else:
	print '{"error" : "no data available"}'
