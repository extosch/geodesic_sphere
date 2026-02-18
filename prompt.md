Baue eine Webseite, die eine geodätische Kugel beliebiger Frequenz (F=1 ist Ikosaeder) 
konstruiert und visualisiert, variabel als Flächen oder Gittermodell. 
Der Algorithmus unterteilt sukzessive die gleichseitigen Dreiecke des Ikosaeders
durch Unterteilung der Kanten in 2, 3, 4, 5, .. Abschnitte, die dann die Kanten der
neuen Dreiecke der um 1 erhöhten Frequenz bilden.
  
Design: Schwarzer Hintergrund, Flächen Grau, Gitter wie, Licht von schräg rechts oben.
Die Webseite beinhaltet ein Eingabefeld für die Frequenz F und ein Ausgabefeld für die Anzahl der Ecken, Kanten
und Zahl der unterschiedlichen Kantenlängen und zwei Checkboxen für Flächen und Gitter-Modell.
Das erzeugte Objekt rotiert um die eigeen Achse. Der Maus werden die üblichen Steuerfunktionen Zoom, Pan und
Rotation (um Objekt-Achse) zugeordnet.

Du bist ein erfahrender Programmierer und lässt dir Zeit zum Nachdenken.
Technik: html, css, Javascript +  WEbGL.
Erzeuge separate index, script, style und README files