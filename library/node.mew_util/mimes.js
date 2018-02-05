var mimes={".7z":"application/x-7z-compressed",".aac":"audio/x-aac",".ai":"application/illustrator",".aif":"audio/x-aiff",".aiff":"audio/x-aiff",".air":"application/vnd.adobe.air-application-installer-package+zip",".apk":"application/vnd.android.package-archive",".asm":"text/x-asm",".avi":"video/x-msvideo",".bmp":"image/bmp",".bz":"application/x-bzip",".bz2":"application/x-bzip2",".c":"text/x-c",".cab":"application/vnd.ms-cab-compressed",".cc":"text/x-c",".chm":"application/vnd.ms-htmlhelp",".class":"application/java-vm",".conf":"text/plain",".cpp":"text/x-c",".crt":"application/x-x509-ca-cert",".crx":"application/x-chrome-extension",".css":"text/css",".csv":"text/csv",".cxx":"text/x-c",".deb":"application/x-debian-package",".djvu":"image/vnd.djvu",".dmg":"application/x-apple-diskimage",".doc":"application/msword",".docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",".dot":"application/msword",".dotx":"application/vnd.openxmlformats-officedocument.wordprocessingml.template",".dtd":"application/xml-dtd",".dwg":"image/vnd.dwg",".dxf":"image/vnd.dxf",".ecma":"application/ecmascript",".eml":"message/rfc822",".eot":"application/vnd.ms-fontobject",".eps":"application/postscript",".epub":"application/epub+zip",".f4v":"video/x-f4v",".flac":"audio/x-flac",".flv":"video/x-flv",".gif":"image/gif",".h":"text/x-c",".hh":"text/x-c",".hpp":"text/x-c",".htm":"text/html",".html":"text/html",".icc":"application/vnd.iccprofile",".ico":"image/x-icon",".ics":"text/calendar",".ini":"text/plain",".jar":"application/java-archive",".java":"text/x-java-source",".jpeg":"image/jpeg",".jpg":"image/jpeg",".js":"application/javascript",".json":"application/json",".jsonml":"application/jsonml+json",".latex":"application/x-latex",".lha":"application/x-lzh-compressed",".lnk":"application/x-ms-shortcut",".log":"text/plain",".lua":"text/x-lua",".luac":"application/x-lua-bytecode",".lzh":"application/x-lzh-compressed",".m2a":"audio/mpeg",".m2v":"video/mpeg",".m3a":"audio/mpeg",".m3u":"audio/x-mpegurl",".m3u8":"application/vnd.apple.mpegurl",".m4a":"audio/mp4",".m4r":"audio/mp4",".m4u":"video/vnd.mpegurl",".m4v":"video/x-m4v",".manifest":"text/cache-manifest",".map":"application/json",".mathml":"application/mathml+xml",".md":"text/x-markdown",".mdb":"application/x-msaccess",".mid":"audio/midi",".midi":"audio/midi",".mkv":"video/x-matroska",".mng":"video/x-mng",".mobi":"application/x-mobipocket-ebook",".mov":"video/quicktime",".mp2":"audio/mpeg",".mp2a":"audio/mpeg",".mp3":"audio/mpeg",".mp4":"video/mp4",".mp4a":"audio/mp4",".mp4v":"video/mp4",".mpeg":"video/mpeg",".mpg":"video/mpeg",".mpga":"audio/mpeg",".mpkg":"application/vnd.apple.installer+xml",".nfo":"text/x-nfo",".odb":"application/vnd.oasis.opendocument.database",".odc":"application/vnd.oasis.opendocument.chart",".odf":"application/vnd.oasis.opendocument.formula",".odft":"application/vnd.oasis.opendocument.formula-template",".odg":"application/vnd.oasis.opendocument.graphics",".odi":"application/vnd.oasis.opendocument.image",".odm":"application/vnd.oasis.opendocument.text-master",".odp":"application/vnd.oasis.opendocument.presentation",".ods":"application/vnd.oasis.opendocument.spreadsheet",".odt":"application/vnd.oasis.opendocument.text",".oga":"audio/ogg",".ogg":"audio/ogg",".ogv":"video/ogg",".otc":"application/vnd.oasis.opendocument.chart-template",".otf":"font/opentype",".otg":"application/vnd.oasis.opendocument.graphics-template",".oth":"application/vnd.oasis.opendocument.text-web",".oti":"application/vnd.oasis.opendocument.image-template",".otp":"application/vnd.oasis.opendocument.presentation-template",".ots":"application/vnd.oasis.opendocument.spreadsheet-template",".ott":"application/vnd.oasis.opendocument.text-template",".p":"text/x-pascal",".p10":"application/pkcs10",".p12":"application/x-pkcs12",".p7b":"application/x-pkcs7-certificates",".p7c":"application/pkcs7-mime",".p7m":"application/pkcs7-mime",".p7r":"application/x-pkcs7-certreqresp",".p7s":"application/pkcs7-signature",".p8":"application/pkcs8",".pas":"text/x-pascal",".pcx":"image/x-pcx",".pdf":"application/pdf",".pfx":"application/x-pkcs12",".pic":"image/x-pict",".png":"image/png",".pp":"text/x-pascal",".pps":"application/vnd.ms-powerpoint",".ppsx":"application/vnd.openxmlformats-officedocument.presentationml.slideshow",".ppt":"application/vnd.ms-powerpoint",".pptx":"application/vnd.openxmlformats-officedocument.presentationml.presentation",".ps":"application/postscript",".psd":"image/vnd.adobe.photoshop",".pub":"application/x-mspublisher",".qt":"video/quicktime",".rar":"application/x-rar-compressed",".rm":"application/vnd.rn-realmedia",".rmvb":"application/vnd.rn-realmedia-vbr",".rtf":"application/rtf",".s":"text/x-asm",".ser":"application/java-serialized-object",".sh":"application/x-sh",".sldx":"application/vnd.openxmlformats-officedocument.presentationml.slide",".spc":"application/x-pkcs7-certificates",".sql":"application/x-sql",".svg":"image/svg+xml",".svgz":"image/svg+xml",".swf":"application/x-shockwave-flash",".tar":"application/x-tar",".tcl":"application/x-tcl",".tex":"application/x-tex",".text":"text/plain",".tga":"image/x-tga",".tif":"image/tiff",".tiff":"image/tiff",".torrent":"application/x-bittorrent",".ttc":"application/x-font-ttf",".ttf":"application/x-font-ttf",".txt":"text/plain",".udeb":"application/x-debian-package",".uri":"text/uri-list",".uris":"text/uri-list",".urls":"text/uri-list",".vcard":"text/vcard",".vcf":"text/x-vcard",".wav":"audio/x-wav",".wbmp":"image/vnd.wap.wbmp",".weba":"audio/webm",".webm":"video/webm",".webp":"image/webp",".wks":"application/vnd.ms-works",".wm":"video/x-ms-wm",".wma":"audio/x-ms-wma",".wmd":"application/x-ms-wmd",".wmf":"application/x-msmetafile",".wmv":"video/x-ms-wmv",".wmx":"video/x-ms-wmx",".wmz":"application/x-msmetafile",".woff":"application/font-woff",".woff2":"application/font-woff2",".wpl":"application/vnd.ms-wpl",".wps":"application/vnd.ms-works",".wri":"application/x-mswrite",".wsdl":"application/wsdl+xml",".xap":"application/x-silverlight-app",".xht":"application/xhtml+xml",".xhtml":"application/xhtml+xml",".xif":"image/vnd.xiff",".xls":"application/vnd.ms-excel",".xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",".xlt":"application/vnd.ms-excel",".xltx":"application/vnd.openxmlformats-officedocument.spreadsheetml.template",".xml":"application/xml",".xps":"application/vnd.ms-xpsdocument",".xsd":"application/xml",".xsl":"application/xslt+xml",".xslt":"application/xslt+xml",".xul":"application/vnd.mozilla.xul+xml",".yaml":"text/yaml",".yml":"text/yaml",".zip":"application/zip"};module.exports=mimes;