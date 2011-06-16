Http by Using XML (HUX)

I- LICENCE
==========
    HTTP by Using XML (HUX)
    Copyright (C) 2011  Florent FAYOLLE

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    

II- Description and Features
============================

HUX (for Http by Using XML) gives you a simple way to load HTML content with XML Http Requests (in other words : *AJAX*) without writing any line of Javascript! You will only need to have basic knowledges in (X)HTML.

HUX aims at being simple and powerful. With HUX, you can : 

 - load content in your HTML document dynamically (i.e. you do not refresh the whole page)
 - simply update the URL when a new content is loaded
 - use the Previous/Next Button
 - send the data of a form and load the answer of the server dynamically
 - ``other features coming soon...``
 


III- Advantages
===============

It offers the following advantages: 

- it is much easier to set than Ajax
- you load data dynamically, using <A> links
- Search Engine can index your website, while Ajax does not originally
- you can get back contents thanks to URL update


IV- "Installation"
==================
Just download hux.js, and include it in your HTML documents, in the <HEAD> Section, like this : 

::

	<script type="text/javascript" src="/path/to/hux.js" ></script>

V- How-To
=========
Let's begin !

For now, there is three possible applications with HUX : 
 - create links without URL Update
 - create links with URL Update
 - create forms
 
1- Links without URL update
---------------------------
Note: The attributes which are relative to HUX are prefixed with *data\-hux\-*. It is the advised prefix (it avoids possible conflicts with other Frameworks and is HTML5 valid), but you can also use the following prefixes : *data-* (HTML5 valid), *hux:* (XHTML only, avoids conflicts, but doesn't pass the W3C validator), and no prefix (doesn't pass the W3C validator).

For that, you have at your disposal 3 attributes : 
 - href: the link to the content to load
 - data-hux-targetnode: the id of the node which will receive the content loaded thanks to HUX
 - data-hux-filling: (optional) indicates how HUX should inject the content. Its value can be : 
	* "replace" (default) : we empty the target node, and replace its content
	* "append" : we inject the content at the end of the target node
	* "prepend" : we inject the content at the beginning of the target node

Example : 

::

	<div id="container">This content will be replaced once the user will click on the following link : </div>
	<p><a href="/path/to/content.html" data-hux-targetnode="container">Load !</a></p>
	





2- Links with URL update
------------------------
You just need to create a link of this form : 

::

   <a href="#!TARGET_NODE_ID=/path/to/content.html">click me</a>

Where TARGET_NODE_ID is the id of the node whose content will be replaced by the freshly loaded one.

Example : 

::

 <div id="container">This content will be replaced once the user will click on the following link :</div>
 <p><a href="#!container=/path/to/content.html">Load !</a></p>

Note : to make pretty URL with Apache (for example, have #!container=content), you should use an .htaccess, with the mod RewriteEngine enabled.
	See http://httpd.apache.org/docs/1.3/mod/mod_rewrite.html

3- Forms
--------
You have at your disposal 4 attributes : 
 - action: the URL where to send the form data once the user submits. HUX will send the data asynchronously.
 - method: "GET" or "POST"
 - data-hux-targetnode: see *1- Links without URL update*
 - data-hux-filling: (optional) see *1- Links without URL update*. **Default is "append"**
 
Example : 

::

	<div id="comments"></div>
	<form hux:targetnode="comments" action="/path/to/cgi_treatment" method="POST">
	  <p>login :<br/><input type="text" name="login" /></p>
	  <p>Comment : <br/><textarea name="comment" id="comment_content" ></textarea></p>
	</form>



VI- Use it!
===========
Stop reading, try it!