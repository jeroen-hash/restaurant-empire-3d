# RESTAURANT EMPIRE 3D

Een realistische 3D-horeca- en levenssimulator. Dit project is onafhankelijk van ANIMO HACCP en ANIMO POS.

## Eerste prototype

Deze eerste technische proefversie bevat:
- Een eerste 3D-straatbeeld met ANIMO-bedrijven en een afzonderlijke CC0-winkelgevel voor ANIMO CAFE.
- Botsingen met gebouwen zodat je niet meer door gevels loopt.
- Een eerste betreedbare locatie: ANIMO CAFE, met eetzaal en professionele keuken.
- Een rigged 3D-personage met idle- en loopanimatie (CC0-model, geladen via GLB).
- Derde- en eerste-persoonsperspectief.
- Touchjoystick voor mobiele toestellen.
- Camera draaien door te slepen.
- Een spelklok: 1 echte minuut = 1 spelminuut.
- Pauzeren en lokaal opslaan in de browser.

## Testen

Open de gepubliceerde webversie in Safari zodra GitHub Pages is ingeschakeld. De Three.js-module wordt op dit moment vanaf jsDelivr geladen; daarvoor is een internetverbinding nodig.

## Ontwikkelafspraken

- Eerst singleplayer; multiplayer pas in een latere fase.
- Mobiel eerst: iPhone en iPad, daarnaast Windows.
- Eerste test via Safari; later eventueel Android APK en iOS-app.
- Alle fictieve commerciële namen gebruiken het ANIMO-merk.
- Geen betaalde ontwikkeltools of verplichte betaalde diensten.
- De bestaande live ANIMO HACCP- en ANIMO POS-projecten blijven onaangeroerd.

## Belangrijke scope-opmerking

Dit is een technische basis/prototype, geen afgewerkte game. De huidige gebouwen, personage en materialen zijn nog deels procedurele placeholder-assets. De eerste toegankelijke ANIMO CAFE-interieurzone is een verticale gameplaytest, nog geen definitieve fotorealistische asset. Ze voldoen nog niet aan de afgesproken uiteindelijke fotorealistische kwaliteitsnorm. Hoogwaardige 3D-modellen, animaties, audio, uitgebreide stad, hotelschool en gameplay worden in afzonderlijke bouwstappen toegevoegd.


## Externe test-assets (CC0)

- Casual Walker: https://tevy.dev/models/casual-walker — CC0 1.0; rigged personage met idle-, walk-, wave- en look-around-animaties.
- Storefront Base Module: https://tevy.dev/models/storefront-module — CC0 1.0; modulaire winkelgevel.

Deze modellen worden rechtstreeks via HTTPS geladen. Voor deze eerste test zijn ze nog geen definitieve, op maat gemaakte fotorealistische Belgische stadsassets. De overige straatgebouwen zijn voorlopig nog prototypegeometrie. De browser moet internettoegang hebben om Three.js en de modellen te laden.
